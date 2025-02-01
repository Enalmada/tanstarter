import { describe, expect, it, vi } from "vitest";
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
			const query = queries.task.byId(taskId);
			expect(query.queryKey).toEqual(["task", "byId", taskId]);
			expect(typeof query.queryFn).toBe("function");
		});
	});
});
