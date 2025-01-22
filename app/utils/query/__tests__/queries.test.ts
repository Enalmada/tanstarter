import { describe, expect, it, vi } from "vitest";
import { findFirst, findMany } from "~/server/services/base-service";
import { queries } from "../queries";

// Mock dependencies
/*
vi.mock("~/server/auth/auth", () => ({
	getAuthSession: vi.fn(),
}));
*/

vi.mock("~/server/services/base-service", () => ({
	findFirst: vi.fn(),
	findMany: vi.fn(),
	createEntity: vi.fn(),
	updateEntity: vi.fn(),
	deleteEntity: vi.fn(),
}));

describe("queries", () => {
	describe("task queries", () => {
		it("should generate correct task list query", () => {
			const query = queries.task.list({ userId: "123" });
			expect(query.queryKey).toEqual([
				"task",
				"list",
				{ filters: { userId: "123" } },
			]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should generate correct task list query", () => {
			const query = queries.task.list();
			expect(query.queryKey).toEqual(["task", "list", { filters: undefined }]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should generate correct task detail query", () => {
			const taskId = "123";
			const query = queries.task.detail(taskId);
			expect(query.queryKey).toEqual(["task", "detail", taskId]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should call correct service methods", async () => {
			// Test list query
			const mockSignal = new AbortController().signal;
			await queries.task.list({ userId: "123" }).queryFn({
				queryKey: ["task", "list", { filters: { userId: "123" } }] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(findMany).toHaveBeenCalled();

			// Test detail query
			const taskId = "123";
			await queries.task.detail(taskId).queryFn({
				queryKey: ["task", "detail", taskId] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(findFirst).toHaveBeenCalledWith({
				data: { where: { id: taskId }, subject: "Task" },
			});
		});
	});
});
