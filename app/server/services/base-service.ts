import { createServerFn } from "@tanstack/start";
import { eq } from "drizzle-orm";
import { any, object, parse, picklist, string } from "valibot";
import { authMiddleware } from "~/middleware/auth-guard";
import type { SubjectType } from "../access/ability";
import { accessCheck } from "../access/check";
import DB from "../db";
import {
	TaskTable,
	UserTable,
	taskInsertSchema,
	userInsertSchema,
} from "../db/schema";

// Map of subject types to their corresponding tables
const tables = {
	Task: TaskTable,
	User: UserTable,
} as const;

// Map of subject types to their corresponding insert schemas
const insertSchemas = {
	Task: taskInsertSchema,
	User: userInsertSchema,
} as const;

export const validateDeleteEntity = object({
	subject: picklist(["Task", "User"] as const),
	id: string(),
});

export const deleteEntity = createServerFn({ method: "POST" })
	.validator(validateDeleteEntity)
	.middleware([authMiddleware])
	.handler(async ({ data: { subject, id }, context }) => {
		const table = tables[subject as keyof typeof tables];

		const [entity] = await DB.select().from(table).where(eq(table.id, id));

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		accessCheck(context.user, "delete", subject as SubjectType, entity);

		const [result] = await DB.delete(table).where(eq(table.id, id)).returning();

		return result;
	});

export const validateCreateEntity = object({
	subject: picklist(["Task", "User"] as const),
	data: any(),
});

export const createEntity = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const { subject, data } = parse(validateCreateEntity, input);

		// Get the schema for this subject type
		const schema = insertSchemas[subject as keyof typeof insertSchemas];
		if (!schema) {
			throw new Error(`No schema found for subject type: ${subject}`);
		}

		// Validate the data using the subject-specific schema
		const validatedData = parse(schema, data);

		return {
			subject,
			data: validatedData,
		};
	})
	.middleware([authMiddleware])
	.handler(async ({ data: { subject, data }, context }) => {
		const table = tables[subject as keyof typeof tables];

		const createWith = {
			...data,
			userId: context.user.id,
			createdById: context.user.id,
			updatedById: context.user.id,
			version: 1,
		};

		accessCheck(context.user, "create", subject as SubjectType, createWith);

		const [result] = await DB.insert(table).values(createWith).returning();

		return result;
	});
