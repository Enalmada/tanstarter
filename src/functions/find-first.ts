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
	const { accessCheck } = await import("~/server/access/check");
	const { logger } = await import("~/utils/logger");
	const { buildWhereClause } = await import("~/server/db/DrizzleOrm");
	const { getUser, loadEntityConfig } = await import("~/functions/base-service");

	const user = await getUser();
	logger.info("findFirst", { data, userId: user.id });

	const config = await loadEntityConfig();
	const { table, query } = config[data.subject];
	const whereList = buildWhereClause(table, data.where);

	const result = await query.findFirst({ where: whereList, with: data.with });

	if (!result) {
		throw new Error(`${data.subject} ${data.where?.id ?? "record"} not found`);
	}

	accessCheck(user, "read", data.subject, result);
	return result;
}

export const findFirst = createServerFn({ method: "GET" })
	.inputValidator(validateFindFirstInput)
	.handler(handleFindFirst);
