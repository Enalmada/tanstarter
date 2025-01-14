import { describe, expect, it, vi } from "vitest";
import {
	baseEntityMock,
	mockUserId,
} from "~/server/services/__tests__/base-service.test";
import { type Task, TaskStatus } from "../../db/schema";

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

// biome-ignore lint/suspicious/noExportsInTest: <explanation>
export const mockTaskId = "tsk_1";
const fixedDate = new Date("2023-08-28T21:37:27.238Z");

const mockTask: Task = {
	id: mockTaskId,
	title: "Task 1",
	description: null,
	dueDate: fixedDate,
	status: TaskStatus.ACTIVE,
	userId: mockUserId,
	...baseEntityMock,
};

const mockTaskInput = {
	title: mockTask.title,
	description: mockTask.description,
	status: mockTask.status,
	dueDate: mockTask.dueDate,
};

import { validateNewTask, validateUpdateTask } from "../task-service";

describe("task-service validation", () => {
	describe("validateNewTask", () => {
		it("should validate a valid task", () => {
			const result = validateNewTask(mockTaskInput);
			expect(result).toEqual({
				...mockTaskInput,
				userId: "",
			});
		});

		it("should throw error for missing title", () => {
			const { title, ...invalidInput } = mockTaskInput;
			expect(() => validateNewTask(invalidInput)).toThrow(
				"Invalid task data: title: Invalid type: Expected string but received undefined",
			);
		});

		it("should throw error for invalid status", () => {
			const invalidInput = {
				...mockTaskInput,
				status: "INVALID",
			};
			expect(() => validateNewTask(invalidInput)).toThrow(
				'Invalid task data: status: Invalid type: Expected ("ACTIVE" | "COMPLETED") but received "INVALID"',
			);
		});

		it("should throw error for invalid date", () => {
			const invalidInput = {
				...mockTaskInput,
				dueDate: "invalid-date",
			};
			expect(() => validateNewTask(invalidInput)).toThrow(
				"Invalid task data: dueDate: Invalid date format",
			);
		});
	});

	describe("validateUpdateTask", () => {
		const validUpdateInput = {
			id: mockTaskId,
			data: mockTaskInput,
		};

		it("should validate a valid update", () => {
			const result = validateUpdateTask(validUpdateInput);
			expect(result).toEqual(validUpdateInput);
		});

		it("should throw error for invalid id", () => {
			const invalidInput = {
				...validUpdateInput,
				id: "",
			};
			expect(() => validateUpdateTask(invalidInput)).toThrow(
				"Invalid task data: ID cannot be empty",
			);
		});

		it("should throw error for invalid status", () => {
			const invalidInput = {
				...validUpdateInput,
				data: {
					...mockTaskInput,
					status: "INVALID",
				},
			};
			expect(() => validateUpdateTask(invalidInput)).toThrow(
				'Invalid task data: data: Invalid type: Expected ("ACTIVE" | "COMPLETED") but received "INVALID"',
			);
		});
	});
});
