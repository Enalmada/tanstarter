/**
 * `deleteEntity` server function — generic delete CRUD over the entity
 * registry in `~/functions/base-service`.
 *
 * Split out of `base-service.ts` per the gell-v2 convention: each
 * createServerFn lives in its own per-handler file so client-reachable
 * modules (e.g. `~/utils/query/mutations.ts`) can import this surface
 * without dragging the server-only imports inside `base-service.ts`
 * through the `@tanstack/react-start` v1.167 import-protection plugin.
 */

import { createServerFn } from "@tanstack/react-start";
import { safeParse } from "valibot";
import { formatIssues, validateDeleteEntity } from "~/functions/base-service";
import type { EntityType } from "~/lib/entity-types";
import { BadRequestError } from "~/server/access/http-errors";

function validateDeleteEntityInput(input: unknown) {
	const result = safeParse(validateDeleteEntity, input);
	if (!result.success) {
		throw new BadRequestError(formatIssues(result, "entity"));
	}
	return result.output;
}

export async function handleDeleteEntity({ data: { subject, id } }: { data: { subject: EntityType; id: string } }) {
	const { eq } = await import("drizzle-orm");
	const db = (await import("~/server/db")).default;
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const { getUser, loadEntityConfig } = await import("~/functions/base-service");

	const user = await getUser();
	logger.info("deleteEntity", { subject, id, userId: user.id });

	const config = await loadEntityConfig();
	const { table } = config[subject];
	const [entity] = await db.select().from(table).where(eq(table.id, id));

	if (!entity) {
		throw new Error(`${subject} ${id} not found`);
	}

	accessCheck(user, "delete", subject, entity);

	// biome-ignore lint/suspicious/noExplicitAny: dynamic-imported entity table is `any`
	const deleted = (await db.delete(table).where(eq(table.id, id)).returning()) as any[];
	return deleted[0];
}

export const deleteEntity = createServerFn({ method: "POST" })
	.inputValidator(validateDeleteEntityInput)
	.handler(handleDeleteEntity);
