/**
 * Generic CRUD Service Implementation
 *
 * Type-safe, generic CRUD API for entities in the system.
 * Handles common operations (create, read, update, delete) with:
 * - Input validation via valibot
 * - CASL access control checks
 * - Consistent error handling (BadRequestError for validation)
 * - Optimistic concurrency control via version numbers
 *
 * TSS-2: Drizzle, CASL, auth, and the logger are dynamic-imported
 * inside each handler. Top-level imports are limited to the framework,
 * valibot, the client-safe ENTITY_TYPES, and the HTTP error vocabulary.
 *
 * Per-entity files should prefer per-resource handlers (with typed
 * NotFoundError + safeMessage info-hiding); this generic surface stays
 * for the simple cases.
 */

import { createServerFn } from "@tanstack/react-start";
import { any, object, optional, picklist, safeParse, string } from "valibot";
import { ENTITY_TYPES, type EntityType } from "~/lib/entity-types";
import { BadRequestError } from "~/server/access/http-errors";

// -----------------------------------------------------------------------------
// Validators (sync, top-level — no server-only imports needed)
// -----------------------------------------------------------------------------

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

function formatIssues(error: unknown, subject: string): string {
	if (error && typeof error === "object" && "issues" in error) {
		const issues = ((error as { issues: Array<{ path?: Array<{ key: string }>; message?: string }> }).issues ?? [])
			.map((issue) => {
				const path = issue.path?.[0]?.key;
				return path ? `${path}: ${issue.message}` : issue.message;
			})
			.join("; ");
		return `Validation failed for ${subject}: ${issues}`;
	}
	return `Validation failed for ${subject}`;
}

export const validateDeleteEntity = object({
	subject: picklist(ENTITY_TYPES),
	id: string(),
});

export const validateCreateEntity = object({
	subject: picklist(ENTITY_TYPES),
	data: any(), // Subject-specific schema applied after the outer parse
});

type ValidateCreateEntityType = {
	subject: EntityType;
	data: Record<string, unknown>;
};

export const validateUpdateEntity = object({
	subject: picklist(ENTITY_TYPES),
	id: string(),
	data: any(),
});

export const validateFindFirst = object({
	subject: picklist(ENTITY_TYPES),
	where: optional(any()),
	with: optional(any()),
});

export const validateFindMany = object({
	subject: picklist(ENTITY_TYPES),
	where: optional(any()),
	with: optional(any()),
});

// Where-schema is currently permissive; we keep the helper so future
// validation slots in without touching every handler.
function createWhereSchema(_subject: EntityType) {
	return object({});
}

// -----------------------------------------------------------------------------
// Server-only helpers — these dynamic-import every Drizzle/auth/access module.
// -----------------------------------------------------------------------------

type EntityHandle = {
	// biome-ignore lint/suspicious/noExplicitAny: Drizzle table types depend on dynamic schema lookup
	table: any;
	// biome-ignore lint/suspicious/noExplicitAny: Drizzle query builder type is opaque here
	query: any;
	// biome-ignore lint/suspicious/noExplicitAny: drizzle-valibot insert/update/select schema types
	schemas: { select: any; insert: any; update: any };
};

async function loadEntityConfig(): Promise<Record<EntityType, EntityHandle>> {
	const db = (await import("~/server/db")).default;
	const {
		TaskTable,
		taskInsertSchema,
		taskSelectSchema,
		taskUpdateSchema,
		UserTable,
		userInsertSchema,
		userSelectSchema,
		userUpdateSchema,
	} = await import("~/server/db/schema");

	return {
		Task: {
			get table() {
				return TaskTable;
			},
			get query() {
				// biome-ignore lint/suspicious/noExplicitAny: drizzle query type is opaque
				return db.query.TaskTable as any;
			},
			schemas: { select: taskSelectSchema, insert: taskInsertSchema, update: taskUpdateSchema },
		},
		User: {
			get table() {
				return UserTable;
			},
			get query() {
				// biome-ignore lint/suspicious/noExplicitAny: drizzle query type is opaque
				return db.query.UserTable as any;
			},
			schemas: { select: userSelectSchema, insert: userInsertSchema, update: userUpdateSchema },
		},
	};
}

async function getUser() {
	const { checkPlaywrightTestAuth } = await import("~/utils/test/playwright");
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) return mockUser;

	const { getRequest, setResponseStatus } = await import("@tanstack/react-start/server");
	const request = getRequest();
	if (!request) {
		setResponseStatus(500);
		throw new Error("No web request available");
	}

	const { auth } = await import("~/server/auth/auth");
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
}

// -----------------------------------------------------------------------------
// Handlers — inline exported named functions (per TanStack Start extraction rules).
// -----------------------------------------------------------------------------

export async function handleDeleteEntity({ data: { subject, id } }: { data: { subject: EntityType; id: string } }) {
	const { eq } = await import("drizzle-orm");
	const db = (await import("~/server/db")).default;
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const config = await loadEntityConfig();

	const user = await getUser();
	logger.info("deleteEntity", { subject, id, userId: user.id });

	const { table } = config[subject];
	const [entity] = await db.select().from(table).where(eq(table.id, id));

	if (!entity) {
		throw new Error(`${subject} ${id} not found`);
	}

	accessCheck(user, "delete", subject, entity);

	// biome-ignore lint/suspicious/noExplicitAny: dynamic-imported entity table is `any`, returning() type is opaque
	const deleted = (await db.delete(table).where(eq(table.id, id)).returning()) as any[];
	return deleted[0];
}

export const deleteEntity = createServerFn({ method: "POST" })
	.inputValidator(validateDeleteEntity)
	.handler(handleDeleteEntity);

export async function handleCreateEntity({ data }: { data: { subject: EntityType; data: Record<string, unknown> } }) {
	const db = (await import("~/server/db")).default;
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const config = await loadEntityConfig();

	const user = await getUser();
	logger.info("createEntity", { data, userId: user.id });

	const { subject, data: entityData } = data as CreateEntityPayload;
	const { table } = config[subject];

	const createWith = {
		...(entityData as Record<string, unknown>),
		createdById: user.id,
		updatedById: user.id,
		version: 1,
	};

	accessCheck(user, "create", subject, createWith);

	// biome-ignore lint/suspicious/noExplicitAny: dynamic-imported entity table is `any`
	const inserted = (await db.insert(table).values(createWith).returning()) as any[];
	return inserted[0];
}

export const createEntity = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => {
		const outer = safeParse(validateCreateEntity, input);
		if (!outer.success) {
			throw new BadRequestError(formatIssues(outer, "entity"));
		}

		// NOTE: subject-specific schema validation happens inside the handler,
		// not in this validator, because the Drizzle-valibot schemas import the
		// Drizzle table layer (TSS-2). The outer pick at least pins `subject` so
		// downstream code can rely on EntityType.
		const { subject, data } = outer.output as ValidateCreateEntityType;
		return { subject, data } as const;
	})
	.handler(async ({ data: outerData }) => {
		// Subject-specific schema validation runs here with the lazy-loaded schemas
		const config = await loadEntityConfig();
		const schema = config[outerData.subject].schemas.insert;
		const dataResult = safeParse(schema, outerData.data);
		if (!dataResult.success) {
			throw new BadRequestError(formatIssues(dataResult, outerData.subject));
		}
		return handleCreateEntity({
			data: { subject: outerData.subject, data: dataResult.output as Record<string, unknown> },
		});
	});

export async function handleUpdateEntity({
	data,
}: {
	data: { subject: EntityType; id: string; data: Record<string, unknown> };
}) {
	const { eq } = await import("drizzle-orm");
	const db = (await import("~/server/db")).default;
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const config = await loadEntityConfig();

	const user = await getUser();
	logger.info("updateEntity", { data, userId: user.id });

	const { subject, id, data: entityData } = data as UpdateEntityPayload;
	const { table } = config[subject];

	const [entity] = await db.select().from(table).where(eq(table.id, id)).limit(1);
	if (!entity) {
		throw new Error(`${subject} ${id} not found`);
	}

	// userFormSchema / taskFormSchema in ~/types/validation.ts type `version` as
	// `nullish(string())` (form inputs are strings), but the schema column is an
	// integer. Coerce stringified versions before comparing — a strict `!==`
	// between `1` and `"1"` would otherwise always fire and break every update.
	const rawVersion = (entityData as Record<string, unknown>).version;
	const incomingVersion =
		typeof rawVersion === "string" && rawVersion.trim() !== "" ? Number.parseInt(rawVersion, 10) : rawVersion;
	if (entity.version && entity.version !== incomingVersion) {
		throw new Error(`${subject} has changed since loading.  Please reload and try again.`);
	}

	accessCheck(user, "update", subject, entity);

	const updateWith = {
		...(entityData as Record<string, unknown>),
		updatedAt: new Date(),
		updatedById: user.id,
		version: entity.version + 1,
	};

	// biome-ignore lint/suspicious/noExplicitAny: dynamic-imported entity table is `any`
	const updated = (await db.update(table).set(updateWith).where(eq(table.id, id)).returning()) as any[];
	return updated[0];
}

export const updateEntity = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => {
		const outer = safeParse(validateUpdateEntity, input);
		if (!outer.success) {
			throw new BadRequestError(formatIssues(outer, "entity"));
		}
		const { subject, id, data } = outer.output as UpdateEntityPayload;
		return { subject, id, data };
	})
	.handler(async ({ data: outerData }) => {
		const config = await loadEntityConfig();
		const schema = config[outerData.subject].schemas.update;
		const dataResult = safeParse(schema, outerData.data);
		if (!dataResult.success) {
			throw new BadRequestError(formatIssues(dataResult, outerData.subject));
		}
		return handleUpdateEntity({
			data: {
				subject: outerData.subject,
				id: outerData.id,
				data: dataResult.output as Record<string, unknown>,
			},
		});
	});

export async function handleFindFirst({
	data,
}: {
	data: {
		subject: EntityType;
		where: Record<string, unknown> | undefined;
		with: Record<string, unknown> | undefined;
	};
}) {
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const { buildWhereClause } = await import("~/server/db/DrizzleOrm");
	const config = await loadEntityConfig();

	const user = await getUser();
	logger.info("findFirst", { data, userId: user.id });

	const { subject, where, with: withRelations } = data as FindEntityPayload;
	const { table, query } = config[subject];
	const whereList = buildWhereClause(table, where);

	const result = await query.findFirst({ where: whereList, with: withRelations });

	if (!result) {
		throw new Error(`${subject} ${where?.id ?? "record"} not found`);
	}

	accessCheck(user, "read", subject, result);
	return result;
}

export const findFirst = createServerFn({ method: "GET" })
	.inputValidator((input: unknown) => {
		const outer = safeParse(validateFindFirst, input);
		if (!outer.success) {
			throw new BadRequestError(formatIssues(outer, "entity"));
		}
		const { subject, where, with: withRelations } = outer.output as FindEntityPayload;
		if (where) {
			const whereResult = safeParse(createWhereSchema(subject), where);
			if (!whereResult.success) {
				throw new BadRequestError(formatIssues(whereResult, subject));
			}
		}
		return { subject, where, with: withRelations };
	})
	.handler(handleFindFirst);

export async function handleFindMany({
	data,
}: {
	data: {
		subject: EntityType;
		where: Record<string, unknown> | undefined;
		with: Record<string, unknown> | undefined;
	};
}) {
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const { buildWhereClause } = await import("~/server/db/DrizzleOrm");
	const config = await loadEntityConfig();

	const user = await getUser();
	logger.info("findMany", { data, userId: user.id });

	const { subject, where, with: withRelations } = data as FindEntityPayload;
	const { table, query } = config[subject];
	const whereList = buildWhereClause(table, where);

	accessCheck(user, "list", subject, where);

	return query.findMany({ where: whereList, with: withRelations });
}

export const findMany = createServerFn({ method: "GET" })
	.inputValidator((input: unknown) => {
		const outer = safeParse(validateFindMany, input);
		if (!outer.success) {
			throw new BadRequestError(formatIssues(outer, "entity"));
		}
		const { subject, where, with: withRelations } = outer.output as FindEntityPayload;
		if (where) {
			const whereResult = safeParse(createWhereSchema(subject), where);
			if (!whereResult.success) {
				throw new BadRequestError(formatIssues(whereResult, subject));
			}
		}
		return { subject, where, with: withRelations };
	})
	.handler(handleFindMany);

/**
 * Usage:
 * ```ts
 * // Create
 * const task = await createEntity({
 *   data: { subject: "Task", data: { title: "New Task" } },
 *   context: { user }
 * });
 *
 * // Read
 * const tasks = await findMany({
 *   data: { subject: "Task", where: { userId: user.id } },
 *   context: { user }
 * });
 *
 * // Update
 * const updated = await updateEntity({
 *   data: { subject: "Task", id: "task_1", data: { title: "Updated" } },
 *   context: { user }
 * });
 *
 * // Delete
 * const deleted = await deleteEntity({
 *   data: { subject: "Task", id: "task_1" },
 *   context: { user }
 * });
 * ```
 */
