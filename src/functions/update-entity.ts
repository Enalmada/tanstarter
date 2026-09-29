/**
 * `updateEntity` server function — generic update CRUD over the entity
 * registry in `~/functions/base-service`. See `delete-entity.ts` header
 * for the splitting rationale.
 *
 * Optimistic-concurrency: compares `entity.version` (DB integer) against
 * the version on the incoming payload. Stringified versions from form
 * inputs are coerced via `Number.parseInt` so the comparison is always
 * integer-vs-integer.
 */

import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { safeParse } from "valibot";
import { formatIssues, validateUpdateEntity } from "~/functions/base-service";
import type { EntityType } from "~/lib/entity-types";
import { BadRequestError } from "~/server/access/http-errors";

// Columns the server owns; stripped from every client patch before writing.
// `emailVerified` is only ever set by better-auth's verification flows.
const SERVER_MANAGED_FIELDS = ["id", "createdAt", "createdById", "emailVerified"] as const;

type UpdateEntityInputShape = { subject: EntityType; id: string; data: Record<string, unknown> };

function validateUpdateEntityInput(input: unknown): UpdateEntityInputShape {
	const result = safeParse(validateUpdateEntity, input);
	if (!result.success) {
		throw new BadRequestError(formatIssues(result, "entity"));
	}
	const { subject, id, data } = result.output as UpdateEntityInputShape;
	return { subject, id, data };
}

export const handleUpdateEntity = createServerOnlyFn(
	async ({ data }: { data: { subject: EntityType; id: string; data: Record<string, unknown> } }) => {
		const { eq } = await import("drizzle-orm");
		const db = (await import("~/server/db")).default;
		const { accessCheck } = await import("~/server/access/check");
		const { logger } = await import("~/utils/logger");
		const { getUser, loadEntityConfig } = await import("~/functions/base-service");

		const user = await getUser();
		// Metadata only: never log client-supplied values.
		logger.info("updateEntity", {
			subject: data.subject,
			id: data.id,
			fields: Object.keys(data.data ?? {}),
			userId: user.id,
		});

		const config = await loadEntityConfig();
		const { subject, id, data: entityData } = data;
		const { table, schemas } = config[subject];

		// Subject-specific schema validation runs here (drizzle-valibot
		// schemas import Drizzle — keep them off the input validator's scope).
		const dataResult = safeParse(schemas.update, entityData);
		if (!dataResult.success) {
			throw new BadRequestError(formatIssues(dataResult, subject));
		}

		const [entity] = await db.select().from(table).where(eq(table.id, id)).limit(1);

		// Authorize BEFORE the version check so missing / unreadable / stale
		// records can't be told apart by an unauthorized caller.
		const { ConflictError, NotFoundError } = await import("~/server/access/http-errors");
		const { filterReadableRow } = await import("~/server/access/read-filter");
		if (!entity || !filterReadableRow(user, subject, entity, undefined)) {
			throw new NotFoundError(`${subject} ${id} not found`);
		}
		accessCheck(user, "update", subject, entity);

		// Server-managed columns are never taken from the client patch.
		const patch = { ...(dataResult.output as Record<string, unknown>) };
		for (const key of SERVER_MANAGED_FIELDS) {
			delete patch[key];
		}

		// userFormSchema / taskFormSchema in ~/types/validation.ts type `version` as
		// `nullish(string())` (form inputs are strings), but the schema column is an
		// integer. Coerce stringified versions before comparing — a strict `!==`
		// between `1` and `"1"` would otherwise always fire and break every update.
		const rawVersion = (dataResult.output as Record<string, unknown>).version;
		const incomingVersion =
			typeof rawVersion === "string" && rawVersion.trim() !== "" ? Number.parseInt(rawVersion, 10) : rawVersion;
		if (entity.version != null && entity.version !== incomingVersion) {
			throw new ConflictError(`${subject} has changed since loading.  Please reload and try again.`);
		}

		const updateWith = {
			...patch,
			updatedAt: new Date(),
			updatedById: user.id,
			version: entity.version + 1,
		};

		// The patched row must still be one the caller may update — e.g. a member
		// can't move their task to another user's `userId`.
		accessCheck(user, "update", subject, { ...entity, ...updateWith });

		// Write only if owner and version are still the ones just authorized.
		const { authorizedRowPredicate } = await import("~/server/access/write-guard");
		const updated = (await db
			.update(table)
			.set(updateWith)
			.where(authorizedRowPredicate(table, entity))
			// biome-ignore lint/suspicious/noExplicitAny: dynamic-imported entity table is `any`
			.returning()) as any[];
		if (updated.length === 0) {
			throw new ConflictError(`${subject} has changed since loading.  Please reload and try again.`);
		}
		return updated[0];
	},
);

export const updateEntity = createServerFn({ method: "POST" })
	.validator(validateUpdateEntityInput)
	.handler(handleUpdateEntity);
