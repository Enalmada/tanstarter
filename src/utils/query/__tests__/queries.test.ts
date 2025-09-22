import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { findFirst, findMany } from "~/functions/base-service";
import { queries } from "~/utils/query/queries";

// Mock variables
const mockUserId = "usr_1";
const mockTaskId = "tsk_1";

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

vi.mock("@tanstack/react-start", () => ({
	useServerFn: vi.fn((fn) => fn), // Just pass through the function in tests
	createServerFn: vi.fn(() => ({
		handler: vi.fn(() => vi.fn()), // Mock the handler method which returns a function
	})),
}));

describe("queries", () => {
	// Add a mock QueryClient at the top of the test
	const mockQueryClient = new QueryClient();

	describe("task queries", () => {
		it("should generate correct task list query with userId", () => {
			const query = queries.task.list({ userId: mockUserId });
			expect(query.queryKey).toEqual(["task", "list", { filters: { userId: mockUserId } }]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should generate correct task list query without userId", () => {
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
				queryKey: ["task", "list", { filters: { userId: mockUserId } }] as const,
				signal: mockSignal,
				meta: undefined,
				client: mockQueryClient,
			});
			expect(mockFindMany).toHaveBeenCalledWith({
				data: { where: { userId: mockUserId }, subject: "Task" },
			});

			// Test detail query
			await queries.task.byId(mockTaskId).queryFn({
				queryKey: ["task", "byId", mockTaskId] as const,
				signal: mockSignal,
				meta: undefined,
				client: mockQueryClient,
			});
			expect(mockFindFirst).toHaveBeenCalledWith({
				data: { where: { id: mockTaskId }, subject: "Task" },
			});
		});

		it("should fetch tasks list", async () => {
			// Test that the query function exists and can be called
			await queries.task.list({ userId: mockUserId }).queryFn({
				queryKey: ["task", "list", { filters: { userId: mockUserId } }] as const,
				signal: new AbortController().signal,
				meta: undefined,
				client: mockQueryClient,
			});
			// Verify the service was called
			expect(findMany).toHaveBeenCalled();
		});

		it("should fetch task by id", async () => {
			// Test that the query function exists and can be called
			await queries.task.byId(mockTaskId).queryFn({
				queryKey: ["task", "byId", mockTaskId] as const,
				signal: new AbortController().signal,
				meta: undefined,
				client: mockQueryClient,
			});
			// Verify the service was called
			expect(findFirst).toHaveBeenCalled();
		});
	});
});
