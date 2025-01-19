import { createServerFn } from "@tanstack/start";
import { eq } from "drizzle-orm";
import { any, object, parse, picklist, string } from "valibot";
import { authMiddleware } from "~/middleware/auth-guard";
import type { SubjectType } from "../access/ability";
import { ENTITY_TYPES } from "../access/ability";
import { accessCheck } from "../access/check";
import DB from "../db";
import {
	TaskTable,
	UserTable,
	taskInsertSchema,
	taskUpdateSchema,
	userInsertSchema,
	userUpdateSchema,
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

const updateSchemas = {
	Task: taskUpdateSchema,
	User: userUpdateSchema,
} as const;

export const validateDeleteEntity = object({
	subject: picklist(ENTITY_TYPES),
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
	subject: picklist(ENTITY_TYPES),
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

		try {
			// Validate the data using the subject-specific schema
			const validatedData = parse(schema, data);
			return {
				subject,
				data: validatedData,
			};
		} catch (error) {
			if (error && typeof error === "object" && "issues" in error) {
				const issues = (
					error.issues as Array<{
						path?: Array<{ key: string }>;
						message?: string;
					}>
				)
					.map((issue) => {
						const path = issue.path?.[0]?.key;
						return path ? `${path}: ${issue.message}` : issue.message;
					})
					.join(", ");
				throw new Error(`Validation failed for ${subject}: ${issues}`);
			}
			throw error;
		}
	})
	.middleware([authMiddleware])
	.handler(async ({ data: { subject, data }, context }) => {
		const table = tables[subject as keyof typeof tables];

		const createWith = {
			...data,
			createdById: context.user.id,
			updatedById: context.user.id,
			version: 1,
		};

		accessCheck(context.user, "create", subject as SubjectType, createWith);

		const [result] = await DB.insert(table).values(createWith).returning();

		return result;
	});

export const validateUpdateEntity = object({
	subject: picklist(ENTITY_TYPES),
	id: string(),
	data: any(),
});

export const updateEntity = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const { subject, id, data } = parse(validateUpdateEntity, input);

		// Get the schema for this subject type
		const schema = updateSchemas[subject as keyof typeof updateSchemas];
		if (!schema) {
			throw new Error(`No schema found for subject type: ${subject}`);
		}

		try {
			// Validate the data using the subject-specific schema
			const validatedData = parse(schema, data);
			return {
				subject,
				id,
				data: validatedData,
			};
		} catch (error) {
			if (error && typeof error === "object" && "issues" in error) {
				const issues = (
					error.issues as Array<{
						path?: Array<{ key: string }>;
						message?: string;
					}>
				)
					.map((issue) => {
						const path = issue.path?.[0]?.key;
						return path ? `${path}: ${issue.message}` : issue.message;
					})
					.join(", ");
				throw new Error(`Validation failed for ${subject}: ${issues}`);
			}
			throw error;
		}
	})
	.middleware([authMiddleware])
	.handler(async ({ data: { subject, id, data }, context }) => {
		const table = tables[subject as keyof typeof tables];

		const [entity] = await DB.select()
			.from(table)
			.where(eq(table.id, id))
			.limit(1);

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		if (entity.version && entity.version !== data.version) {
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

		const [result] = await DB.update(table)
			.set(updateWith)
			.where(eq(table.id, id))
			.returning();

		return result;
	});

export const validateFindFirst = object({
	subject: picklist(ENTITY_TYPES),
	id: string(),
});

export const findFirst = createServerFn({ method: "GET" })
	.validator(validateFindFirst)
	.middleware([authMiddleware])
	.handler(async ({ data: { subject, id }, context }) => {
		const table = tables[subject as keyof typeof tables];

		const [result] = await DB.select()
			.from(table)
			.where(eq(table.id, id))
			.limit(1);

		if (!result) {
			throw new Error(`${subject} ${id} not found`);
		}

		accessCheck(context.user, "read", subject, result);

		return result;
	});
