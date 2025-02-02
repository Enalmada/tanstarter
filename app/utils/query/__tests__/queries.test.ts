import { describe, expect, it, vi } from "vitest";
import { findFirst, findMany } from "~/functions/base-service";
import { mockTaskId, mockUserId } from "~/test/setup";
import { queries } from "../queries";

// Mock dependencies
/*
vi.mock("~/server/auth/auth", () => ({
	getAuthSession: vi.fn(),
}));
*/

vi.mock("~/functions/base-service", () => ({
	findFirst: vi.fn(),
	findMany: vi.fn(),
	createEntity: vi.fn(),
	updateEntity: vi.fn(),
	deleteEntity: vi.fn(),
}));

describe("queries", () => {
	describe("task queries", () => {
		it("should generate correct task list query", () => {
			const query = queries.task.list({ userId: mockUserId });
			expect(query.queryKey).toEqual([
				"task",
				"list",
				{ filters: { userId: mockUserId } },
			]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should generate correct task list query", () => {
			const query = queries.task.list();
			expect(query.queryKey).toEqual(["task", "list", { filters: undefined }]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should generate correct task detail query", () => {
			const query = queries.task.byId(mockTaskId);
			expect(query.queryKey).toEqual(["task", "byId", mockTaskId]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should call correct service methods", async () => {
			const mockFindMany = vi.fn();
			const mockFindFirst = vi.fn();

			vi.mocked(findMany).mockImplementation(mockFindMany);
			vi.mocked(findFirst).mockImplementation(mockFindFirst);

			// Test list query
			const mockSignal = new AbortController().signal;
			await queries.task.list({ userId: mockUserId }).queryFn({
				queryKey: [
					"task",
					"list",
					{ filters: { userId: mockUserId } },
				] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(mockFindMany).toHaveBeenCalledWith({
				data: { where: { userId: mockUserId }, subject: "Task" },
			});

			// Test detail query
			await queries.task.byId(mockTaskId).queryFn({
				queryKey: ["task", "byId", mockTaskId] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(mockFindFirst).toHaveBeenCalledWith({
				data: { where: { id: mockTaskId }, subject: "Task" },
			});
		});
	});
});
