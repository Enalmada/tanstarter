/**
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotAuthorizedError } from "~/server/access/http-errors";
import { auditMutation } from "../mutation-audit";

const CLIENT_IP = "203.0.113.9";
const request = vi.hoisted(() => ({ current: null as Request | null }));

vi.mock("../request", () => ({ getSessionRequest: async () => request.current }));

const user = { id: "usr_1" };

function setup() {
	const logs: { message: string; data: Record<string, unknown> }[] = [];
	const write = (message: string, data: Record<string, unknown>) => logs.push({ message, data });
	return { logs, write };
}

beforeEach(() => {
	request.current = new Request("http://localhost/_serverFn/x", { headers: { "fly-client-ip": CLIENT_IP } });
});

describe("auditMutation", () => {
	it("logs a success with the target, user and client IP, and returns the result", async () => {
		const { logs, write } = setup();
		const result = await auditMutation(
			write,
			"deleteEntity",
			{ subject: "task", id: "tsk_1" },
			user,
			async () => "done",
		);

		expect(result).toBe("done");
		expect(logs).toEqual([
			{
				message: "audit.mutation",
				data: {
					action: "deleteEntity",
					outcome: "success",
					subject: "task",
					id: "tsk_1",
					userId: "usr_1",
					ip: CLIENT_IP,
				},
			},
		]);
	});

	it("logs the HTTP status of a refused call and rethrows the same error", async () => {
		const { logs, write } = setup();
		const refusal = new NotAuthorizedError("User usr_1 may not delete task tsk_9 titled secret-title");

		await expect(
			auditMutation(write, "deleteEntity", { subject: "task", id: "tsk_9" }, user, async () => {
				throw refusal;
			}),
		).rejects.toBe(refusal);

		expect(logs[0]?.data).toMatchObject({ outcome: "failure", status: 403, userId: "usr_1", ip: CLIENT_IP });
		expect(JSON.stringify(logs)).not.toContain("secret-title");
	});

	it("logs an unexpected error as a 500", async () => {
		const { logs, write } = setup();
		await expect(
			auditMutation(write, "updateEntity", { subject: "task", id: "tsk_1" }, user, async () => {
				throw new Error("connection refused");
			}),
		).rejects.toThrow("connection refused");

		expect(logs[0]?.data).toMatchObject({ outcome: "failure", status: 500 });
	});

	it("logs a null IP outside a request", async () => {
		request.current = null;
		const { logs, write } = setup();
		await auditMutation(write, "createEntity", { subject: "task" }, user, async () => 1);

		expect(logs[0]?.data).toMatchObject({ outcome: "success", ip: null });
		expect(logs[0]?.data).not.toHaveProperty("id");
	});
});
