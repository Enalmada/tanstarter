/**
 * `findFirst` server function — generic single-entity lookup over the
 * entity registry in `~/functions/base-service`. See `delete-entity.ts`
 * header for the splitting rationale.
 */

import { createServerFn } from "@tanstack/react-start";
import { safeParse } from "valibot";
import { createWhereSchema, type FindEntityPayload, formatIssues, validateFindFirst } from "~/functions/base-service";
import { BadRequestError } from "~/server/access/http-errors";

function validateFindFirstInput(input: unknown): FindEntityPayload {
	const result = safeParse(validateFindFirst, input);
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

export async function handleFindFirst({ data }: { data: FindEntityPayload }) {
	const { getColumns } = await import("drizzle-orm");
	const { logger } = await import("~/utils/logger");
	const { buildWhereClause } = await import("~/server/db/DrizzleOrm");
	const { getUser, loadEntityConfig } = await import("~/functions/base-service");
	const { NotFoundError } = await import("~/server/access/http-errors");
	const { assertSafeWhere, assertSafeWith, filterReadableRow } = await import("~/server/access/read-filter");

	const user = await getUser();
	// Metadata only: filter values (ids, emails) stay out of logs.
	logger.info("findFirst", {
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

	const result = await query.findFirst({ where: whereList, with: data.with });
	const readable = result ? filterReadableRow(user, data.subject, result, data.with) : null;

	// Missing and forbidden look identical, so callers can't probe which
	// records (e.g. which emails) exist.
	if (!readable) {
		throw new NotFoundError(`${data.subject} ${data.where?.id ?? "record"} not found or not readable`);
	}
	return readable;
}

export const findFirst = createServerFn({ method: "GET" })
	.inputValidator(validateFindFirstInput)
	.handler(handleFindFirst);
