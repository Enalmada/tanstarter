import { describe, expect, it, vi } from "vitest";
import { getAuthSession } from "~/server/auth/auth";
import {
	adminTaskService,
	clientTaskService,
} from "~/server/services/task-service";
import { adminUserService } from "~/server/services/user-service";
import { adminQueries, queries } from "../queries";

// Mock dependencies
vi.mock("~/server/auth/auth", () => ({
	getAuthSession: vi.fn(),
}));

vi.mock("~/server/services/task-service", () => ({
	clientTaskService: {
		fetchTasks: vi.fn(),
		fetchTask: vi.fn(),
	},
	adminTaskService: {
		fetchTasks: vi.fn(),
		fetchTask: vi.fn(),
	},
}));

vi.mock("~/server/services/user-service", () => ({
	adminUserService: {
		fetchUsers: vi.fn(),
		fetchUser: vi.fn(),
	},
}));

describe("queries", () => {
	describe("task queries", () => {
		it("should generate correct task list query", () => {
			const query = queries.task.list;
			expect(query.queryKey).toEqual(["task", "list"]);
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
			await queries.task.list.queryFn({
				queryKey: ["task", "list"] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(clientTaskService.fetchTasks).toHaveBeenCalled();

			// Test detail query
			const taskId = "123";
			await queries.task.detail(taskId).queryFn({
				queryKey: ["task", "detail", taskId] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(clientTaskService.fetchTask).toHaveBeenCalledWith({
				data: { id: taskId },
			});
		});
	});

	describe("user queries", () => {
		it("should generate correct auth query", () => {
			const query = queries.user.auth;
			expect(query.queryKey).toEqual(["user", "auth"]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should return user from auth session", async () => {
			const mockUser = {
				id: "123",
				email: "test@example.com",
				name: null,
				avatar_url: null,
				setup_at: null,
			};
			const mockSession = {
				id: "session-123",
				user_id: mockUser.id,
				expires_at: new Date(),
			};
			vi.mocked(getAuthSession).mockResolvedValue({
				session: mockSession,
				user: mockUser,
			});

			const mockSignal = new AbortController().signal;
			const result = await queries.user.auth.queryFn({
				queryKey: ["user", "auth"] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(result).toEqual(mockUser);
		});
	});
});

describe("adminQueries", () => {
	describe("admin task queries", () => {
		it("should generate correct task list query", () => {
			const query = adminQueries.adminTask.list;
			expect(query.queryKey).toEqual(["adminTask", "list"]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should generate correct task detail query", () => {
			const taskId = "123";
			const query = adminQueries.adminTask.detail(taskId);
			expect(query.queryKey).toEqual(["adminTask", "detail", taskId]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should call correct service methods", async () => {
			// Test list query
			const mockSignal = new AbortController().signal;
			await adminQueries.adminTask.list.queryFn({
				queryKey: ["adminTask", "list"] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(adminTaskService.fetchTasks).toHaveBeenCalled();

			// Test detail query
			const taskId = "123";
			await adminQueries.adminTask.detail(taskId).queryFn({
				queryKey: ["adminTask", "detail", taskId] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(adminTaskService.fetchTask).toHaveBeenCalledWith({
				data: { id: taskId },
			});
		});
	});

	describe("admin user queries", () => {
		it("should generate correct user list query", () => {
			const query = adminQueries.adminUser.list;
			expect(query.queryKey).toEqual(["adminUser", "list"]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should generate correct user detail query", () => {
			const userId = "123";
			const query = adminQueries.adminUser.detail(userId);
			expect(query.queryKey).toEqual(["adminUser", "detail", userId]);
			expect(typeof query.queryFn).toBe("function");
		});

		it("should call correct service methods", async () => {
			// Test list query
			const mockSignal = new AbortController().signal;
			await adminQueries.adminUser.list.queryFn({
				queryKey: ["adminUser", "list"] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(adminUserService.fetchUsers).toHaveBeenCalled();

			// Test detail query
			const userId = "123";
			await adminQueries.adminUser.detail(userId).queryFn({
				queryKey: ["adminUser", "detail", userId] as const,
				signal: mockSignal,
				meta: undefined,
			});
			expect(adminUserService.fetchUser).toHaveBeenCalledWith({
				data: { id: userId },
			});
		});
	});
});
