/**
 * `createEntity` server function — generic create CRUD over the entity
 * registry in `~/functions/base-service`. See `delete-entity.ts` header
 * for the splitting rationale.
 *
 * Subject-specific schema validation runs inside the handler (not the
 * inputValidator) because the drizzle-valibot schemas are dynamic-imported
 * with the rest of the Drizzle layer.
 */

import { createServerFn } from "@tanstack/react-start";
import { safeParse } from "valibot";
import { formatIssues, validateCreateEntity } from "~/functions/base-service";
import type { EntityType } from "~/lib/entity-types";
import { BadRequestError } from "~/server/access/http-errors";

type CreateEntityInputShape = { subject: EntityType; data: Record<string, unknown> };

function validateCreateEntityInput(input: unknown): CreateEntityInputShape {
	const result = safeParse(validateCreateEntity, input);
	if (!result.success) {
		throw new BadRequestError(formatIssues(result, "entity"));
	}
	const { subject, data } = result.output as CreateEntityInputShape;
	return { subject, data };
}

export async function handleCreateEntity({ data }: { data: { subject: EntityType; data: Record<string, unknown> } }) {
	const db = (await import("~/server/db")).default;
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const { getUser, loadEntityConfig } = await import("~/functions/base-service");

	const user = await getUser();
	logger.info("createEntity", { data, userId: user.id });

	const config = await loadEntityConfig();
	const { subject, data: entityData } = data;
	const { table, schemas } = config[subject];

	// Subject-specific schema validation happens here (not in the input
	// validator) because the drizzle-valibot schemas import the Drizzle
	// table layer — keep them out of the input validator's compile scope.
	const dataResult = safeParse(schemas.insert, entityData);
	if (!dataResult.success) {
		throw new BadRequestError(formatIssues(dataResult, subject));
	}

	const createWith = {
		...(dataResult.output as Record<string, unknown>),
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
	.inputValidator(validateCreateEntityInput)
	.handler(handleCreateEntity);
