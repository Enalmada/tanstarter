/**
 * Task service implementation
 * Handles all task-related database operations
 * Includes CRUD operations and task status management
 */

import { createServerFn } from "@tanstack/start";
import { and, eq } from "drizzle-orm";
import { object, safeParse, string } from "valibot";
import { authMiddleware } from "~/middleware/auth-guard";
import db from "../db";
import {
	type NewTask,
	type Task,
	TaskStatus,
	type TaskStatusType,
	task,
	taskFormSchema,
} from "../db/schema";

// Valibot validators
const taskIdSchema = string();

const updateTaskSchema = object({
	taskId: string(),
	data: taskFormSchema,
});

function validateTaskId(input: unknown): string {
	const result = safeParse(taskIdSchema, input);
	if (!result.success) {
		throw new Error("Invalid task ID");
	}
	return result.output;
}

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
		status: TaskStatus.ACTIVE,
		user_id: "", // Will be set in handler
	};
}

function validateUpdateTask(input: unknown): {
	taskId: string;
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
		taskId: result.output.taskId,
		data: {
			title: result.output.data.title,
			description: result.output.data.description,
			due_date: result.output.data.due_date,
			status: result.output.data.status as TaskStatusType,
		},
	};
}

/**
 * Fetches all tasks for the current user
 */
export const fetchTasks = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }: { context: { user: { id: string } } }) => {
		try {
			const tasks = await db
				.select()
				.from(task)
				.where(eq(task.user_id, context.user.id))
				.execute();
			return tasks;
		} catch (error) {
			console.error("Error fetching tasks:", error);
			throw new Error("Failed to fetch tasks");
		}
	});

/**
 * Fetches a single task by ID
 */
export const fetchTask = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(validateTaskId)
	.handler(
		async ({
			context,
			data: taskId,
		}: {
			context: { user: { id: string } };
			data: string;
		}) => {
			try {
				const [result] = await db
					.select()
					.from(task)
					.where(and(eq(task.id, taskId), eq(task.user_id, context.user.id)))
					.execute();

				if (!result) {
					throw new Error("Task not found");
				}

				return result;
			} catch (error) {
				console.error("Error fetching task:", error);
				throw new Error("Failed to fetch task");
			}
		},
	);

/**
 * Creates a new task
 */
export const createTask = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(validateNewTask)
	.handler(
		async ({
			context,
			data,
		}: { context: { user: { id: string } }; data: NewTask }) => {
			try {
				const [result] = await db
					.insert(task)
					.values({
						...data,
						user_id: context.user.id,
					})
					.returning()
					.execute();
				return result;
			} catch (error) {
				console.error("Error creating task:", error);
				throw new Error("Failed to create task");
			}
		},
	);

/**
 * Updates an existing task
 */
export const updateTask = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(validateUpdateTask)
	.handler(
		async ({
			context,
			data,
		}: {
			context: { user: { id: string } };
			data: { taskId: string; data: Partial<NewTask> };
		}) => {
			try {
				const [result] = await db
					.update(task)
					.set(data.data)
					.where(
						and(eq(task.id, data.taskId), eq(task.user_id, context.user.id)),
					)
					.returning()
					.execute();

				if (!result) {
					throw new Error("Task not found");
				}

				return result;
			} catch (error) {
				console.error("Error updating task:", error);
				throw new Error("Failed to update task");
			}
		},
	);

/**
 * Deletes a task
 */
export const deleteTask = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(validateTaskId)
	.handler(
		async ({
			context,
			data: taskId,
		}: {
			context: { user: { id: string } };
			data: string;
		}) => {
			try {
				const [result] = await db
					.delete(task)
					.where(and(eq(task.id, taskId), eq(task.user_id, context.user.id)))
					.returning()
					.execute();

				if (!result) {
					throw new Error("Task not found");
				}

				return result;
			} catch (error) {
				console.error("Error deleting task:", error);
				throw new Error("Failed to delete task");
			}
		},
	);
