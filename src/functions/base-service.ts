/**
 * Generic CRUD entity-registry helpers.
 *
 * This module owns:
 * - the entity registry (`loadEntityConfig`) mapping `EntityType` strings to
 *   their Drizzle table, query builder, and drizzle-valibot insert/update
 *   schemas
 * - the authed-actor helper (`getUser`)
 * - the input validators shared across the per-handler files
 * - the validation-error formatter (`formatIssues`)
 *
 * It does NOT define any `createServerFn`. Each handler lives in its
 * own per-handler file (`./find-first.ts`, `./find-many.ts`,
 * `./create-entity.ts`, `./update-entity.ts`, `./delete-entity.ts`) and
 * dynamic-imports the helpers from here.
 *
 * Why the split: `@tanstack/react-start` v1.167's `import-protection`
 * Vite plugin walks the import graph and rejects any module reachable
 * from a client route that imports `@tanstack/react-start/server` (even
 * dynamically). Before the split, this file housed all the createServerFn
 * definitions AND was imported by `~/utils/query/queries.ts` /
 * `~/utils/query/mutations.ts` — pulling its server-only chain into the
 * client compile pass. After the split, `queries.ts` / `mutations.ts`
 * import the slim per-handler files; this module is only reached via
 * dynamic imports inside extracted createServerFn handler bodies, which
 * the framework strips from the client bundle.
 *
 * See the gell-v2 codebase (`src/functions/{find-first,find-many,
 * delete-entity,update-entity,create-entity}.ts` + `base-service.ts`)
 * for the canonical pattern this mirrors.
 */

import { any, object, optional, picklist, string } from "valibot";
import { ENTITY_TYPES, type EntityType } from "~/lib/entity-types";

// -----------------------------------------------------------------------------
// Shared payload types — re-used by the per-handler files via type imports
// -----------------------------------------------------------------------------

export type { EntityType };

export interface BaseEntityPayload {
	subject: EntityType;
}

export interface CreateEntityPayload extends BaseEntityPayload {
	data: Record<string, unknown>;
}

export interface UpdateEntityPayload extends BaseEntityPayload {
	id: string;
	data: Record<string, unknown>;
}

export interface FindEntityPayload extends BaseEntityPayload {
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

// -----------------------------------------------------------------------------
// Outer-input validators (per-handler files run safeParse against these)
// -----------------------------------------------------------------------------

export const validateDeleteEntity = object({
	subject: picklist(ENTITY_TYPES),
	id: string(),
});

export const validateCreateEntity = object({
	subject: picklist(ENTITY_TYPES),
	data: any(), // Subject-specific schema applied inside the handler
});

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

// Where-schema is currently permissive; the helper stays so future
// validation can slot in without touching every handler.
export function createWhereSchema(_subject: EntityType) {
	return object({});
}

// -----------------------------------------------------------------------------
// Validation-error formatter — pure, no server-only chain
// -----------------------------------------------------------------------------

export function formatIssues(error: unknown, subject: string): string {
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

// -----------------------------------------------------------------------------
// Server-only helpers — dynamic-imported by the per-handler files at runtime.
// -----------------------------------------------------------------------------

type EntityHandle = {
	// biome-ignore lint/suspicious/noExplicitAny: Drizzle table types depend on dynamic schema lookup
	table: any;
	// biome-ignore lint/suspicious/noExplicitAny: Drizzle query builder type is opaque here
	query: any;
	// biome-ignore lint/suspicious/noExplicitAny: drizzle-valibot insert/update/select schema types
	schemas: { select: any; insert: any; update: any };
};

export async function loadEntityConfig(): Promise<Record<EntityType, EntityHandle>> {
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

export async function getUser() {
	const { checkPlaywrightTestAuth } = await import("~/utils/test/playwright");
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) return mockUser;

	const { getRequest, setResponseStatus } = await import("@tanstack/react-start/server");
	// `getRequest()` throws (not returns undefined) when the per-request
	// AsyncLocalStorage context isn't active — happens during SSR query
	// prefetch / dehydration in TanStack Start v1.134+. For an authed
	// action this is a fatal condition; surface it as 500.
	let request: Request | undefined;
	try {
		request = getRequest();
	} catch (_error) {
		request = undefined;
	}
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
