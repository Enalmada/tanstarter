/**
 * Task service implementation
 * Handles all task-related database operations
 */

import { createServerFn } from "@tanstack/start";
import { and, eq } from "drizzle-orm";
import { object, safeParse, string } from "valibot";
import DB from "../db";
import {
	type NewTask,
	TaskStatus,
	type TaskStatusType,
	task,
	taskFormSchema,
} from "../db/schema";
import type { ClientTask, Task } from "../db/schema";

import type { ServerFn } from "@tanstack/start";
import { getAuthenticatedUser, idSchema, validateId } from "./base-service";

// Valibot validators
const updateTaskSchema = object({
	id: string(),
	data: taskFormSchema,
});

function validateNewTask(input: unknown): NewTask {
	const result = safeParse(taskFormSchema, input);
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
		status: (result.output.status as TaskStatusType) ?? TaskStatus.ACTIVE, // Default to ACTIVE if not provided
		user_id: "", // Will be set in handler
	};
}

function validateUpdateTask(input: unknown): {
	id: string;
	data: Partial<NewTask>;
} {
	const result = safeParse(updateTaskSchema, input);
	if (!result.success) {
		const errorMessage = result.issues
			.map((issue) => {
				const path = issue.path?.[0]?.key;
				return path ? `${path}: ${issue.message}` : issue.message;
			})
			.join(", ");
		throw new Error(`Invalid update data: ${errorMessage}`);
	}
	return {
		id: result.output.id,
		data: {
			title: result.output.data.title,
			description: result.output.data.description,
			due_date: result.output.data.due_date,
			status: result.output.data.status as TaskStatusType,
		},
	};
}

// Export server functions directly for TanStack Start to discover
// @ts-ignore - TanStack Start type system issue with date serialization
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

// @ts-ignore - TanStack Start type system issue with date serialization
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

// @ts-ignore - TanStack Start type system issue with date serialization
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

// @ts-ignore - TanStack Start type system issue with date serialization
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

// @ts-ignore - TanStack Start type system issue with date serialization
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
