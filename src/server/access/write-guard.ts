/**
 * Write predicate for the generic update/delete handlers.
 *
 * Handlers authorize the row they read, then write. Matching the write on
 * `id` alone would let a concurrent change (e.g. an admin reassigning a task)
 * slip between the check and the write, so the write also requires the
 * ownership and version that were authorized. Zero affected rows means the
 * row changed underneath the caller.
 */

import "@tanstack/react-start/server-only";
import { and, eq, getColumns, isNull, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

const GUARDED_COLUMNS = ["userId", "version"] as const;

export function authorizedRowPredicate(table: PgTable, entity: Record<string, unknown>): SQL {
	const columns = getColumns(table) as Record<string, Parameters<typeof eq>[0]>;
	const idColumn = columns.id;
	if (!idColumn) {
		throw new Error("authorizedRowPredicate: table has no id column");
	}
	const conditions: SQL[] = [eq(idColumn, entity.id)];
	for (const key of GUARDED_COLUMNS) {
		const column = columns[key];
		if (!column) continue;
		const value = entity[key];
		conditions.push(value == null ? isNull(column) : eq(column, value));
	}
	return and(...conditions) as SQL;
}
