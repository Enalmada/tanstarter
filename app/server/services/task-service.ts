/**
 * Task service implementation
 * Handles all task-related database operations
 */

import { createServerFn } from "@tanstack/start";
import { eq } from "drizzle-orm";
import { object, partial, safeParse, string } from "valibot";
import DB from "../db";
import {
	type TaskInsert,
	TaskStatus,
	task,
	taskFormSchema,
} from "../db/schema";
import { getAuthenticatedUser, validateId } from "./base-service";

// Valibot validators
const updateTaskSchema = object({
	id: string(),
	data: partial(taskFormSchema), // Make all fields optional for updates
});

export function validateNewTask(input: unknown): TaskInsert {
	if (!input || typeof input !== "object") {
		throw new Error("Invalid task data: Input must be an object");
	}

	// Add default status if not provided
	const processedInput = {
		status: TaskStatus.ACTIVE,
		...input,
	};

	// Convert string date to Date object if needed
	if (
		"due_date" in processedInput &&
		typeof processedInput.due_date === "string"
	) {
		try {
			const date = new Date(processedInput.due_date);
			if (Number.isNaN(date.getTime())) {
				throw new Error("Invalid date format");
			}
			processedInput.due_date = date;
		} catch {
			throw new Error("Invalid task data: due_date: Invalid date format");
		}
	}

	const result = safeParse(taskFormSchema, processedInput);
	if (!result.success) {
		const errorMessage = result.issues
			.map((issue) => {
				const path = issue.path?.[0]?.key;
				return path ? `${path}: ${issue.message}` : issue.message;
			})
			.join(", ");
		throw new Error(`Invalid task data: ${errorMessage}`);
	}

	return {
		...result.output,
		user_id: "", // Will be set in handler
	};
}

export function validateUpdateTask(input: unknown): {
	id: string;
	data: Partial<TaskInsert>;
} {
	if (!input || typeof input !== "object") {
		throw new Error("Invalid task data: Input must be an object");
	}

	// Validate ID first
	if (
		!("id" in input) ||
		typeof input.id !== "string" ||
		input.id.length === 0
	) {
		throw new Error("Invalid task data: ID cannot be empty");
	}

	// Convert string date to Date object if needed
	const processedInput = { ...input } as {
		id: string;
		data: Record<string, unknown>;
	};
	if (
		"data" in processedInput &&
		typeof processedInput.data === "object" &&
		processedInput.data &&
		"due_date" in processedInput.data &&
		typeof processedInput.data.due_date === "string"
	) {
		try {
			const date = new Date(processedInput.data.due_date);
			if (Number.isNaN(date.getTime())) {
				throw new Error("Invalid date format");
			}
			processedInput.data = {
				...processedInput.data,
				due_date: date,
			};
		} catch {
			throw new Error("Invalid task data: due_date: Invalid date format");
		}
	}

	const result = safeParse(updateTaskSchema, processedInput);
	if (!result.success) {
		const errorMessage = result.issues
			.map((issue) => {
				const path = issue.path?.[0]?.key;
				return path ? `${path}: ${issue.message}` : issue.message;
			})
			.join(", ");
		throw new Error(`Invalid task data: ${errorMessage}`);
	}

	const { id, data } = result.output;
	const { user_id, created_at, updated_at, ...updateData } = data;
	return {
		id,
		data: updateData,
	};
}

// Export server functions directly for TanStack Start to discover
export const fetchTasks = createServerFn({ method: "GET" }).handler(
	async () => {
		const user = await getAuthenticatedUser();
		const tasks = await DB.select()
			.from(task)
			.where(eq(task.user_id, user.id))
			.execute();
		return tasks;
	},
);

export const fetchTask = createServerFn({ method: "GET" })
	.validator(validateId)
	.handler(async ({ data: id }) => {
		const user = await getAuthenticatedUser();
		const [result] = await DB.select()
			.from(task)
			.where(eq(task.id, id))
			.execute();

		if (!result) {
			throw new Error("Task not found");
		}

		return result;
	});

export const createTask = createServerFn({ method: "POST" })
	.validator(validateNewTask)
	.handler(async ({ data }) => {
		const user = await getAuthenticatedUser();
		const [result] = await DB.insert(task)
			.values({
				...data,
				user_id: user.id,
			})
			.returning()
			.execute();
		return result;
	});

export const updateTask = createServerFn({ method: "POST" })
	.validator(validateUpdateTask)
	.handler(async ({ data }) => {
		const user = await getAuthenticatedUser();
		const [result] = await DB.update(task)
			.set(data.data)
			.where(eq(task.id, data.id))
			.returning()
			.execute();

		if (!result) {
			throw new Error("Task not found");
		}

		return result;
	});

export const deleteTask = createServerFn({ method: "POST" })
	.validator(validateId)
	.handler(async ({ data: id }) => {
		const user = await getAuthenticatedUser();
		const [result] = await DB.delete(task)
			.where(eq(task.id, id))
			.returning()
			.execute();

		if (!result) {
			throw new Error("Task not found");
		}

		return result;
	});

// Create service objects that use the server functions
export const adminTaskService = {
	fetchTasks,
	fetchTask,
	createTask,
	updateTask,
	deleteTask,
};

export const clientTaskService = {
	fetchTasks,
	fetchTask,
	createTask,
	updateTask,
	deleteTask,
};
