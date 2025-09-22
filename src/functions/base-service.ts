import { createServerFn } from "@tanstack/react-start";
import { getWebRequest, setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { any, object, optional, picklist, safeParse, string } from "valibot";
import { ENTITY_TYPES } from "~/server/access/ability";
import { accessCheck } from "~/server/access/check";
import { auth, type SessionUser } from "~/server/auth/auth";
import db from "~/server/db";
import { buildWhereClause } from "~/server/db/DrizzleOrm";
import {
	TaskTable,
	taskInsertSchema,
	taskSelectSchema,
	taskUpdateSchema,
	UserTable,
	userInsertSchema,
	userSelectSchema,
	userUpdateSchema,
} from "~/server/db/schema";
import { logger } from "~/utils/logger";
import { checkPlaywrightTestAuth } from "~/utils/test/playwright";

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
const createWhereSchema = (_subject: EntityType) => {
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

const getUser = async (): Promise<SessionUser> => {
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) {
		return mockUser;
	}

	// Normal auth flow
	const request = getWebRequest();
	if (!request) {
		setResponseStatus(500);
		throw new Error("No web request available");
	}

	const session = await auth.api.getSession({
		headers: request.headers,
		query: {
			// ensure session is fresh
			// https://www.better-auth.com/docs/concepts/session-management#session-caching
			disableCookieCache: true,
		},
	});

	if (!session) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return session.user;
};

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
	.handler(async ({ data: { subject, id } }) => {
		const user = await getUser();
		logger.info("deleteEntity", { subject, id, userId: user.id });

		const table = entityConfig[subject as EntityType].table;

		const [entity] = await db.select().from(table).where(eq(table.id, id));

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		accessCheck(user, "delete", subject, entity);

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
	.handler(async ({ data }) => {
		const user = await getUser();

		logger.info("createEntity", { data, userId: user.id });

		const { subject, data: entityData } = data as CreateEntityPayload;

		const { table } = entityConfig[subject as EntityType];

		const createWith = {
			...(entityData as Record<string, unknown>),
			createdById: user.id,
			updatedById: user.id,
			version: 1,
		};

		accessCheck(user, "create", subject, createWith);

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
	.handler(async ({ data }) => {
		const user = await getUser();

		logger.info("updateEntity", { data, userId: user.id });

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

		accessCheck(user, "update", subject, entity);

		const updateWith = {
			...(entityData as Record<string, unknown>),
			updatedAt: new Date(),
			updatedById: user.id,
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
	.handler(async ({ data }) => {
		const user = await getUser();

		logger.info("findFirst", { data, userId: user.id });

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

		accessCheck(user, "read", subject, result);

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
	.handler(async ({ data }) => {
		const user = await getUser();

		logger.info("findMany", { data, userId: user.id });

		const { subject, where, with: withRelations } = data as FindEntityPayload;

		const { table, query } = entityConfig[subject as EntityType];
		const whereList = buildWhereClause(table, where);

		accessCheck(user, "list", subject, where);

		const result = await query.findMany({
			where: whereList,
			with: withRelations,
		});

		return result;
	});

/**
 * Generic CRUD Service Implementation
 *
 * This service provides a type-safe, generic CRUD API for entities in the system.
 * It handles common operations like create, read, update, delete with:
 * - Type safety through TypeScript and Valibot schemas
 * - Access control checks
 * - Consistent error handling
 * - Optimistic concurrency control via version numbers
 *
 * Usage:
 * ```ts
 * // Create
 * const task = await createEntity({
 *   data: {
 *     subject: "Task",
 *     data: { title: "New Task" }
 *   },
 *   context: { user }
 * });
 *
 * // Read
 * const tasks = await findMany({
 *   data: {
 *     subject: "Task",
 *     where: { userId: user.id }
 *   },
 *   context: { user }
 * });
 *
 * // Update
 * const updated = await updateEntity({
 *   data: {
 *     subject: "Task",
 *     id: "task_1",
 *     data: { title: "Updated" }
 *   },
 *   context: { user }
 * });
 *
 * // Delete
 * const deleted = await deleteEntity({
 *   data: {
 *     subject: "Task",
 *     id: "task_1"
 *   },
 *   context: { user }
 * });
 * ```
 */
