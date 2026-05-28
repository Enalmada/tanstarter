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

import { createServerFn } from "@tanstack/react-start";
import { safeParse } from "valibot";
import { formatIssues, validateUpdateEntity } from "~/functions/base-service";
import type { EntityType } from "~/lib/entity-types";
import { BadRequestError } from "~/server/access/http-errors";

type UpdateEntityInputShape = { subject: EntityType; id: string; data: Record<string, unknown> };

function validateUpdateEntityInput(input: unknown): UpdateEntityInputShape {
	const result = safeParse(validateUpdateEntity, input);
	if (!result.success) {
		throw new BadRequestError(formatIssues(result, "entity"));
	}
	const { subject, id, data } = result.output as UpdateEntityInputShape;
	return { subject, id, data };
}

export async function handleUpdateEntity({
	data,
}: {
	data: { subject: EntityType; id: string; data: Record<string, unknown> };
}) {
	const { eq } = await import("drizzle-orm");
	const db = (await import("~/server/db")).default;
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const { getUser, loadEntityConfig } = await import("~/functions/base-service");

	const user = await getUser();
	logger.info("updateEntity", { data, userId: user.id });

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
	if (!entity) {
		throw new Error(`${subject} ${id} not found`);
	}

	// userFormSchema / taskFormSchema in ~/types/validation.ts type `version` as
	// `nullish(string())` (form inputs are strings), but the schema column is an
	// integer. Coerce stringified versions before comparing — a strict `!==`
	// between `1` and `"1"` would otherwise always fire and break every update.
	const rawVersion = (dataResult.output as Record<string, unknown>).version;
	const incomingVersion =
		typeof rawVersion === "string" && rawVersion.trim() !== "" ? Number.parseInt(rawVersion, 10) : rawVersion;
	if (entity.version && entity.version !== incomingVersion) {
		throw new Error(`${subject} has changed since loading.  Please reload and try again.`);
	}

	accessCheck(user, "update", subject, entity);

	const updateWith = {
		...(dataResult.output as Record<string, unknown>),
		updatedAt: new Date(),
		updatedById: user.id,
		version: entity.version + 1,
	};

	// biome-ignore lint/suspicious/noExplicitAny: dynamic-imported entity table is `any`
	const updated = (await db.update(table).set(updateWith).where(eq(table.id, id)).returning()) as any[];
	return updated[0];
}

export const updateEntity = createServerFn({ method: "POST" })
	.inputValidator(validateUpdateEntityInput)
	.handler(handleUpdateEntity);
