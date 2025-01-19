import { createServerFn } from "@tanstack/start";
import { eq } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { any, object, optional, picklist, safeParse, string } from "valibot";
import { authMiddleware } from "~/middleware/auth-guard";
import { buildWhereClause } from "~/server/db/DrizzleOrm";
import type { SubjectType } from "../access/ability";
import { ENTITY_TYPES } from "../access/ability";
import { accessCheck } from "../access/check";
import db from "../db";
import type * as schema from "../db/schema";
import {
	TaskTable,
	UserTable,
	taskInsertSchema,
	taskSelectSchema,
	taskUpdateSchema,
	userInsertSchema,
	userSelectSchema,
	userUpdateSchema,
} from "../db/schema";

type DbSchema = ExtractTablesWithRelations<typeof schema>;

// Define the consolidated entity configuration
const entityConfig = {
	Task: {
		get table() {
			return TaskTable;
		},
		get query() {
			// biome-ignore lint/suspicious/noExplicitAny: Needed for query builder type
			return db.query.TaskTable as any;
		},
		schemas: {
			select: taskSelectSchema,
			insert: taskInsertSchema,
			update: taskUpdateSchema,
		},
	},
	User: {
		get table() {
			return UserTable;
		},
		get query() {
			// biome-ignore lint/suspicious/noExplicitAny: Needed for query builder type
			return db.query.UserTable as any;
		},
		schemas: {
			select: userSelectSchema,
			insert: userInsertSchema,
			update: userUpdateSchema,
		},
	},
} as const;

// Type helper to get table from entity type
type EntityConfigType = typeof entityConfig;
type EntityType = keyof EntityConfigType;

// Helper function to create a where schema that accepts partial matches
const createWhereSchema = (subject: EntityType) => {
	// Create a basic schema that allows any object for now
	// We can add more specific validation later if needed
	return object({});
};

// Define interfaces for our validation schemas
interface BaseEntityPayload {
	subject: EntityType;
}

interface CreateEntityPayload extends BaseEntityPayload {
	data: Record<string, unknown>;
}

interface UpdateEntityPayload extends BaseEntityPayload {
	id: string;
	data: Record<string, unknown>;
}

interface FindEntityPayload extends BaseEntityPayload {
	where?: Record<string, unknown>;
	with?: {
		[key: string]:
			| true
			| {
					where?: Record<string, unknown>;
					with?: Record<string, true>;
			  };
	};
}

const handleValidationError = (error: unknown, subject: string) => {
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
};

export const validateDeleteEntity = object({
	subject: picklist(ENTITY_TYPES),
	id: string(),
});

export const deleteEntity = createServerFn({ method: "POST" })
	.validator(validateDeleteEntity)
	.middleware([authMiddleware])
	.handler(async ({ data: { subject, id }, context }) => {
		const table = entityConfig[subject as EntityType].table;

		const [entity] = await db.select().from(table).where(eq(table.id, id));

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		accessCheck(context.user, "delete", subject as SubjectType, entity);

		const [result] = await db.delete(table).where(eq(table.id, id)).returning();

		return result;
	});

export const validateCreateEntity = object({
	subject: picklist(ENTITY_TYPES),
	data: any(), // Use any() to pass through the data for subject-specific validation
});

type ValidateCreateEntityType = {
	subject: (typeof ENTITY_TYPES)[number];
	data: Record<string, unknown>;
};

export const createEntity = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const createEntityResult = safeParse(validateCreateEntity, input);
		if (!createEntityResult.success) {
			handleValidationError(createEntityResult, "entity");
		}

		const { subject, data } =
			createEntityResult.output as ValidateCreateEntityType;

		// Get the schema for this subject type
		const schema = entityConfig[subject as EntityType].schemas.insert;
		if (!schema) {
			throw new Error(`No schema found for subject type: ${subject}`);
		}

		// Validate the inner data using the subject-specific schema
		const dataResult = safeParse(schema, data);

		if (!dataResult.success) {
			handleValidationError(dataResult, subject);
		}

		// Return the validated data
		return {
			subject,
			data: dataResult.output as Record<string, unknown>,
		} as const;
	})
	.middleware([authMiddleware])
	.handler(async ({ data, context }) => {
		if (!data) throw new Error("No data provided");
		const { subject, data: entityData } = data as CreateEntityPayload;

		const { table } = entityConfig[subject as EntityType];

		const createWith = {
			...(entityData as Record<string, unknown>),
			createdById: context.user.id,
			updatedById: context.user.id,
			version: 1,
		};

		accessCheck(context.user, "create", subject as SubjectType, createWith);

		const [result] = await db.insert(table).values(createWith).returning();

		return result;
	});

export const validateUpdateEntity = object({
	subject: picklist(ENTITY_TYPES),
	id: string(),
	data: any(),
});

export const updateEntity = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const updateEntityResult = safeParse(validateUpdateEntity, input);
		if (!updateEntityResult.success) {
			handleValidationError(updateEntityResult, "entity");
		}

		const { subject, id, data } =
			updateEntityResult.output as UpdateEntityPayload;

		// Get the schema for this subject type
		const schema = entityConfig[subject as EntityType].schemas.update;
		if (!schema) {
			throw new Error(`No schema found for subject type: ${subject}`);
		}

		const dataResult = safeParse(schema, data);
		if (!dataResult.success) {
			handleValidationError(dataResult, subject);
		}

		return {
			subject,
			id,
			data: dataResult.output as Record<string, unknown>,
		};
	})
	.middleware([authMiddleware])
	.handler(async ({ data, context }) => {
		if (!data) throw new Error("No data provided");
		const { subject, id, data: entityData } = data as UpdateEntityPayload;

		const { table } = entityConfig[subject as EntityType];

		const [entity] = await db
			.select()
			.from(table)
			.where(eq(table.id, id))
			.limit(1);

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		const version = (entityData as Record<string, unknown>).version;
		if (entity.version && entity.version !== version) {
			throw new Error(
				`${subject} has changed since loading.  Please reload and try again.`,
			);
		}

		accessCheck(context.user, "update", subject, entity);

		const updateWith = {
			...(entityData as Record<string, unknown>),
			updatedAt: new Date(),
			updatedById: context.user.id,
			version: entity.version + 1,
		};

		const [result] = await db
			.update(table)
			.set(updateWith)
			.where(eq(table.id, id))
			.returning();

		return result;
	});

export const validateFindFirst = object({
	subject: picklist(ENTITY_TYPES),
	where: optional(any()),
	with: optional(any()),
});

export const findFirst = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const findFirstResult = safeParse(validateFindFirst, input);
		if (!findFirstResult.success) {
			handleValidationError(findFirstResult, "entity");
		}

		const {
			subject,
			where,
			with: withRelations,
		} = findFirstResult.output as FindEntityPayload;

		if (where) {
			const whereSchema = createWhereSchema(subject as EntityType);
			const whereResult = safeParse(whereSchema, where);
			if (!whereResult.success) {
				handleValidationError(whereResult, subject);
			}
		}

		return { subject, where, with: withRelations };
	})
	.middleware([authMiddleware])
	.handler(async ({ data, context }) => {
		if (!data) throw new Error("No data provided");
		const { subject, where, with: withRelations } = data as FindEntityPayload;

		const { table, query } = entityConfig[subject as EntityType];
		const whereList = buildWhereClause(table, where);

		const result = await query.findFirst({
			where: whereList,
			with: withRelations,
		});

		if (!result) {
			throw new Error(`${subject} ${where?.id ?? "record"} not found`);
		}

		accessCheck(context.user, "read", subject, result);

		return result;
	});

export const validateFindMany = object({
	subject: picklist(ENTITY_TYPES),
	where: optional(any()),
	with: optional(any()),
});

export const findMany = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const findManyResult = safeParse(validateFindMany, input);
		if (!findManyResult.success) {
			handleValidationError(findManyResult, "entity");
		}

		const {
			subject,
			where,
			with: withRelations,
		} = findManyResult.output as FindEntityPayload;

		if (where) {
			const whereSchema = createWhereSchema(subject as EntityType);
			const whereResult = safeParse(whereSchema, where);
			if (!whereResult.success) {
				handleValidationError(whereResult, subject);
			}
		}

		return { subject, where, with: withRelations };
	})
	.middleware([authMiddleware])
	.handler(async ({ data, context }) => {
		if (!data) throw new Error("No data provided");
		const { subject, where, with: withRelations } = data as FindEntityPayload;

		const { table, query } = entityConfig[subject as EntityType];
		const whereList = buildWhereClause(table, where);

		accessCheck(context.user, "list", subject, where);

		const result = await query.findMany({
			where: whereList,
			with: withRelations,
		});

		return result;
	});
