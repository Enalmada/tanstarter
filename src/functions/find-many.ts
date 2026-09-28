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
	const { getColumns } = await import("drizzle-orm");
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const { buildWhereClause } = await import("~/server/db/DrizzleOrm");
	const { getUser, loadEntityConfig } = await import("~/functions/base-service");
	const { assertSafeWhere, assertSafeWith, filterReadableRows } = await import("~/server/access/read-filter");

	const user = await getUser();
	// Metadata only: filter values (ids, emails) stay out of logs.
	logger.info("findMany", {
		subject: data.subject,
		where: Object.keys(data.where ?? {}),
		with: Object.keys(data.with ?? {}),
		userId: user.id,
	});

	const config = await loadEntityConfig();
	const { table, query } = config[data.subject];
	assertSafeWhere(data.where, Object.keys(getColumns(table)));
	assertSafeWith(data.subject, data.with);
	const whereList = buildWhereClause(table, data.where);

	// Plain-equality `where` (enforced above) is what the CASL `list` rule
	// can reason about; each returned row is still re-checked with `read`.
	accessCheck(user, "list", data.subject, data.where);

	const rows = await query.findMany({ where: whereList, with: data.with });
	return filterReadableRows(user, data.subject, rows, data.with);
}

export const findMany = createServerFn({ method: "GET" }).inputValidator(validateFindManyInput).handler(handleFindMany);
