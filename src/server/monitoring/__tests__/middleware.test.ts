import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "~/server/access/http-errors";
import { errorReporter, requestErrorReporter } from "~/server/monitoring/middleware";

const server = vi.hoisted(() => ({ getResponseStatus: vi.fn() }));
const session = vi.hoisted(() => ({ getOptionalSessionUser: vi.fn() }));
const posthog = vi.hoisted(() => ({ captureServerException: vi.fn() }));

vi.mock("@tanstack/react-start/server", () => server);
vi.mock("~/server/auth/session", () => session);
vi.mock("~/server/monitoring/posthog", () => posthog);

type ServerFn = (ctx: { next: () => Promise<unknown>; serverFnMeta: { name: string } }) => Promise<unknown>;
// src/test/setup.ts mocks createMiddleware(...).server(fn) to return fn itself
const run = errorReporter as unknown as ServerFn;

function call(error: unknown) {
	return run({
		next: () => Promise.reject(error),
		serverFnMeta: { name: "saveTask" },
	});
}

describe("errorReporter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		server.getResponseStatus.mockReturnValue(200);
		session.getOptionalSessionUser.mockResolvedValue({ id: "usr_1" });
	});

	it("reports an unexpected error with the user id and rethrows it", async () => {
		const error = new Error("boom");
		await expect(call(error)).rejects.toBe(error);
		expect(posthog.captureServerException).toHaveBeenCalledWith(error, {
			distinctId: "usr_1",
			properties: { source: "serverFn", server_fn: "saveTask" },
		});
	});

	it("skips expected domain errors", async () => {
		const error = new NotFoundError("missing");
		await expect(call(error)).rejects.toBe(error);
		expect(posthog.captureServerException).not.toHaveBeenCalled();
	});

	it("skips errors thrown after a 4xx status was set", async () => {
		server.getResponseStatus.mockReturnValue(401);
		const error = new Error("Unauthorized");
		await expect(call(error)).rejects.toBe(error);
		expect(posthog.captureServerException).not.toHaveBeenCalled();
	});

	it("reports without a user when the session lookup fails", async () => {
		session.getOptionalSessionUser.mockRejectedValue(new Error("db down"));
		const error = new Error("boom");
		await expect(call(error)).rejects.toBe(error);
		expect(posthog.captureServerException).toHaveBeenCalledWith(
			error,
			expect.objectContaining({ distinctId: undefined }),
		);
	});

	it("rethrows the original error when reporting itself fails", async () => {
		posthog.captureServerException.mockImplementation(() => {
			throw new Error("posthog down");
		});
		const error = new Error("boom");
		await expect(call(error)).rejects.toBe(error);
	});

	it("passes results through", async () => {
		await expect(run({ next: () => Promise.resolve("ok"), serverFnMeta: { name: "x" } })).resolves.toBe("ok");
	});
});

type RequestFn = (ctx: {
	next: () => Promise<unknown>;
	request: Request;
	handlerType: "serverFn" | "router";
}) => Promise<unknown>;
const runRequest = requestErrorReporter as unknown as RequestFn;

function callRequest(error: unknown, handlerType: "serverFn" | "router" = "router") {
	return runRequest({
		next: () => Promise.reject(error),
		request: new Request("http://localhost/api/thing?token=secret"),
		handlerType,
	});
}

describe("requestErrorReporter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		server.getResponseStatus.mockReturnValue(200);
		session.getOptionalSessionUser.mockResolvedValue({ id: "usr_1" });
	});

	it("reports an unexpected server-route error with the path only", async () => {
		const error = new Error("boom");
		await expect(callRequest(error)).rejects.toBe(error);
		expect(posthog.captureServerException).toHaveBeenCalledWith(error, {
			distinctId: "usr_1",
			properties: { source: "serverRoute", path: "/api/thing" },
		});
	});

	it("leaves server-function errors to errorReporter", async () => {
		await expect(callRequest(new Error("boom"), "serverFn")).rejects.toThrow("boom");
		expect(posthog.captureServerException).not.toHaveBeenCalled();
	});

	it("skips expected errors", async () => {
		await expect(callRequest(new NotFoundError("missing"))).rejects.toThrow("missing");
		expect(posthog.captureServerException).not.toHaveBeenCalled();
	});

	it("passes responses through", async () => {
		const response = new Response("ok");
		await expect(
			runRequest({
				next: () => Promise.resolve(response),
				request: new Request("http://localhost/"),
				handlerType: "router",
			}),
		).resolves.toBe(response);
	});
});
