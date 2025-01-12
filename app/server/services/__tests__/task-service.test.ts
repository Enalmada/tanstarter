import { describe, expect, it, vi } from "vitest";
import { TaskStatus } from "../../db/schema";
import "./setup";

// Import the validation functions directly
const { validateNewTask, validateUpdateTask } = await import("../task-service");

// Mock TanStack Start
vi.mock("@tanstack/start", () => ({
	createServerFn: () => ({
		handler: (fn: (...args: unknown[]) => unknown) => fn,
		validator: () => ({
			handler: (fn: (...args: unknown[]) => unknown) => fn,
		}),
	}),
}));

describe("task-service validation", () => {
	describe("validateNewTask", () => {
		it("should validate a valid task", () => {
			const validTask = {
				title: "Test Task",
				description: "Test Description",
				status: TaskStatus.ACTIVE,
				due_date: new Date().toISOString(),
			};

			const result = validateNewTask(validTask);
			expect(result).toMatchObject({
				title: validTask.title,
				description: validTask.description,
				status: validTask.status,
				user_id: "", // This gets set in the handler
			});
			expect(result.due_date).toBeInstanceOf(Date);
		});

		it("should use ACTIVE as default status", () => {
			const taskWithoutStatus = {
				title: "Test Task",
				description: "Test Description",
				due_date: new Date().toISOString(),
			};

			const result = validateNewTask(taskWithoutStatus);
			expect(result.status).toBe(TaskStatus.ACTIVE);
		});

		it("should throw error for invalid task", () => {
			const invalidTask = {
				// Missing required title
				description: "Test Description",
			};

			expect(() => validateNewTask(invalidTask)).toThrow("Invalid task data");
		});

		it("should throw error for invalid date", () => {
			const invalidTask = {
				title: "Test Task",
				description: "Test Description",
				due_date: "not-a-date",
			};

			expect(() => validateNewTask(invalidTask)).toThrow("Invalid task data");
		});
	});

	describe("validateUpdateTask", () => {
		it("should validate a valid update", () => {
			const validUpdate = {
				id: "123",
				data: {
					title: "Updated Title",
					status: TaskStatus.COMPLETED,
				},
			};

			const result = validateUpdateTask(validUpdate);
			expect(result).toMatchObject({
				id: validUpdate.id,
				data: {
					title: validUpdate.data.title,
					status: validUpdate.data.status,
				},
			});
		});

		it("should throw error for invalid id", () => {
			const invalidUpdate = {
				id: "", // Empty ID
				data: {
					title: "Updated Title",
				},
			};

			expect(() => validateUpdateTask(invalidUpdate)).toThrow(
				"Invalid task data",
			);
		});

		it("should throw error for invalid status", () => {
			const invalidUpdate = {
				id: "123",
				data: {
					status: "INVALID_STATUS",
				},
			};

			expect(() => validateUpdateTask(invalidUpdate)).toThrow(
				"Invalid task data",
			);
		});
	});
});
