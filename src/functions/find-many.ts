/**
 * `findMany` server function — generic list lookup over the entity
 * registry in `~/functions/base-service`. See `delete-entity.ts` header
 * for the splitting rationale.
 */

import { createServerFn } from "@tanstack/react-start";
import { safeParse } from "valibot";
import { createWhereSchema, type FindEntityPayload, formatIssues, validateFindMany } from "~/functions/base-service";
import { BadRequestError } from "~/server/access/http-errors";

function validateFindManyInput(input: unknown): FindEntityPayload {
	const result = safeParse(validateFindMany, input);
	if (!result.success) {
		throw new BadRequestError(formatIssues(result, "entity"));
	}
	const payload = result.output as FindEntityPayload;
	if (payload.where) {
		const whereResult = safeParse(createWhereSchema(payload.subject), payload.where);
		if (!whereResult.success) {
			throw new BadRequestError(formatIssues(whereResult, payload.subject));
		}
	}
	return payload;
}

export async function handleFindMany({ data }: { data: FindEntityPayload }) {
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const { buildWhereClause } = await import("~/server/db/DrizzleOrm");
	const { getUser, loadEntityConfig } = await import("~/functions/base-service");

	const user = await getUser();
	logger.info("findMany", { data, userId: user.id });

	const config = await loadEntityConfig();
	const { table, query } = config[data.subject];
	const whereList = buildWhereClause(table, data.where);

	accessCheck(user, "list", data.subject, data.where);

	return query.findMany({ where: whereList, with: data.with });
}

export const findMany = createServerFn({ method: "GET" }).inputValidator(validateFindManyInput).handler(handleFindMany);
