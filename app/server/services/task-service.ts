/**
 * Task Service
 * Example of using the base service pattern for a new entity
 *
 * Steps to create a new entity service:
 * 1. Define your schema in db/schema.ts
 * 2. Add entity type to Subjects in auth/casl.ts
 * 3. Add permissions for the entity in createAbility() in auth/casl.ts
 * 4. Create a service following this pattern
 */

import { createServerFn } from "@tanstack/start";
import { object, optional, safeParse, string } from "valibot";
import DB from "../db";

import { eq } from "drizzle-orm";
import { authMiddleware } from "~/middleware/auth-guard";
import { accessCheck } from "~/server/access/check";
import { buildWhereClause } from "~/server/db/DrizzleOrm";
import {
	type TaskInsert,
	TaskStatus,
	TaskTable,
	taskFormSchema,
} from "../db/schema";
import { validateId } from "./helpers";

// Create the base service instance
//const taskService = createBaseService<
//	typeof TaskTable.$inferSelect,
//	TaskInsert
//>(TaskTable, "Task");

export const subject = "Task";

const validateFetchTasks = optional(
	object({
		userId: optional(string(), undefined),
	}),
);

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
		"dueDate" in processedInput &&
		typeof processedInput.dueDate === "string"
	) {
		try {
			const date = new Date(processedInput.dueDate);
			if (Number.isNaN(date.getTime())) {
				throw new Error("Invalid date format");
			}
			processedInput.dueDate = date;
		} catch {
			throw new Error("Invalid task data: dueDate: Invalid date format");
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
	};
}

const updateTaskSchema = object({
	id: string(),
	data: taskFormSchema,
});

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
		"dueDate" in processedInput.data &&
		typeof processedInput.data.dueDate === "string"
	) {
		try {
			const date = new Date(processedInput.data.dueDate);
			if (Number.isNaN(date.getTime())) {
				throw new Error("Invalid date format");
			}
			processedInput.data = {
				...processedInput.data,
				dueDate: date,
			};
		} catch {
			throw new Error("Invalid task data: dueDate: Invalid date format");
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
	const { createdAt, updatedAt, ...updateData } = data;
	return {
		id,
		data: updateData,
	};
}

export const fetchTask = createServerFn({ method: "GET" })
	.validator(validateId)
	.middleware([authMiddleware])
	.handler(async ({ data: id, context }) => {
		const result = await DB.query.TaskTable.findFirst({
			where: eq(TaskTable.id, id),
		});

		if (!result) {
			throw new Error("Task not found");
		}

		accessCheck(context.user, "read", subject, result);

		return result;
	});

// Export server functions directly for TanStack Start to discover
export const fetchTasks = createServerFn({ method: "GET" })
	.validator(validateFetchTasks)
	.middleware([authMiddleware])
	.handler(async ({ data, context }) => {
		const criteria = { ...data, userId: data?.userId || context.user.id };

		accessCheck(context.user, "list", subject, data);

		const config = { limit: undefined, offset: undefined };
		const where = buildWhereClause(TaskTable, {
			userId: data?.userId || context.user.id,
		});
		// const orderBy = buildOrderByClause(TaskTable, criteria);

		const tasks = await DB.query.TaskTable.findMany({
			where,
			//orderBy,
			limit: config.limit,
			offset: config.offset,
		});
		return tasks;
	});

/*
export const createTask = createServerFn({ method: "POST" })
	.validator(validateNewTask)
	.middleware([authMiddleware])
	.handler(async ({ data, context }) => {
		const createWith = {
			...data,
			userId: context.user.id,
			createdById: context.user.id,
			updatedById: context.user.id,
			version: 1,
		};

		accessCheck(context.user, "create", subject, createWith);

		const [result] = await DB.insert(TaskTable)
			.values({
				...createWith,
			})
			.returning();

		return result;
	});
	*/

/*
export const updateTask = createServerFn({ method: "POST" })
	.validator(validateUpdateTask)
	.middleware([authMiddleware])
	.handler(async ({ data: { id, data }, context }) => {
		const entity = await DB.query.TaskTable.findFirst({
			where: eq(TaskTable.id, id),
		});

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		if (entity.version !== data.version) {
			// TODO notify user that entity has changed in another tab, device, or session.
			throw new Error(
				`${subject} has changed since loading.  Please reload and try again.`,
			);
		}

		accessCheck(context.user, "update", subject, entity);

		const updateWith = {
			...data,
			updatedAt: new Date(),
			updatedById: context.user.id,
			version: entity.version + 1,
		};

		const [result] = await DB.update(TaskTable)
			.set(updateWith)
			.where(eq(TaskTable.id, id))
			.returning();

		return result;
	});
*/

/*
export const deleteTask = createServerFn({ method: "POST" })
	.validator(validateId)
	.middleware([authMiddleware])
	.handler(async ({ data: id, context }) => {
		const entity = await DB.query.TaskTable.findFirst({
			where: eq(TaskTable.id, id),
		});

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		accessCheck(context.user, "delete", subject, entity);

		const [result] = await DB.delete(TaskTable)
			.where(eq(TaskTable.id, id))
			.returning();

		return result;
	});
	*/

// Create service objects that use the server functions
export const adminTaskService = {
	fetchTasks,
	fetchTask,
};

export const clientTaskService = {
	fetchTasks,
	fetchTask,
};
