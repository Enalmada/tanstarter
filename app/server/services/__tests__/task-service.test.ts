import { describe, expect, it, vi } from "vitest";

type HandlerFn = (...args: unknown[]) => unknown;

vi.mock("@tanstack/start", () => ({
	createServerFn: () => ({
		validator: () => ({
			middleware: () => ({
				handler: (fn: HandlerFn) => fn,
			}),
		}),
		middleware: () => ({
			handler: (fn: HandlerFn) => fn,
		}),
	}),
}));

vi.mock("~/middleware/auth-guard", () => ({
	authMiddleware: vi.fn(),
}));

import { TaskStatus } from "../../db/schema";
import { validateNewTask, validateUpdateTask } from "../task-service";

describe("task-service validation", () => {
	describe("validateNewTask", () => {
		it("should validate a valid task", () => {
			const validInput = {
				title: "Test Task",
				description: "Test Description",
				status: TaskStatus.ACTIVE,
				dueDate: new Date(),
			};
			const result = validateNewTask(validInput);
			expect(result).toEqual({
				...validInput,
				userId: "",
			});
		});

		it("should throw error for missing title", () => {
			const invalidInput = {
				description: "Test Description",
				status: TaskStatus.ACTIVE,
				dueDate: new Date(),
			};
			expect(() => validateNewTask(invalidInput)).toThrow(
				"Invalid task data: title: Invalid type: Expected string but received undefined",
			);
		});

		it("should throw error for invalid status", () => {
			const invalidInput = {
				title: "Test Task",
				description: "Test Description",
				status: "INVALID",
				dueDate: new Date(),
			};
			expect(() => validateNewTask(invalidInput)).toThrow(
				'Invalid task data: status: Invalid type: Expected ("ACTIVE" | "COMPLETED") but received "INVALID"',
			);
		});

		it("should throw error for invalid date", () => {
			const invalidInput = {
				title: "Test Task",
				description: "Test Description",
				status: TaskStatus.ACTIVE,
				dueDate: "invalid-date",
			};
			expect(() => validateNewTask(invalidInput)).toThrow(
				"Invalid task data: dueDate: Invalid date format",
			);
		});
	});

	describe("validateUpdateTask", () => {
		it("should validate a valid update", () => {
			const validInput = {
				id: "123",
				data: {
					title: "Updated Task",
					description: "Updated Description",
					status: TaskStatus.ACTIVE,
					dueDate: new Date(),
				},
			};
			const result = validateUpdateTask(validInput);
			expect(result).toEqual({
				id: "123",
				data: {
					title: "Updated Task",
					description: "Updated Description",
					status: TaskStatus.ACTIVE,
					dueDate: validInput.data.dueDate,
				},
			});
		});

		it("should throw error for invalid id", () => {
			const invalidInput = {
				id: "",
				data: {
					title: "Updated Task",
					description: "Updated Description",
					status: TaskStatus.ACTIVE,
					dueDate: new Date(),
				},
			};
			expect(() => validateUpdateTask(invalidInput)).toThrow(
				"Invalid task data: ID cannot be empty",
			);
		});

		it("should throw error for invalid status", () => {
			const invalidInput = {
				id: "123",
				data: {
					title: "Updated Task",
					description: "Updated Description",
					status: "INVALID",
					dueDate: new Date(),
				},
			};
			expect(() => validateUpdateTask(invalidInput)).toThrow(
				'Invalid task data: data: Invalid type: Expected ("ACTIVE" | "COMPLETED") but received "INVALID"',
			);
		});
	});
});
