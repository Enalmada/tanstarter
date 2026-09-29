/**
 * Read-side guards for the generic `findFirst` / `findMany` server functions.
 *
 * The client supplies `where` and `with` directly, so both are untrusted:
 *
 * - `where` may only be plain equality on the subject's own columns. Drizzle
 *   RQBv2 also accepts operator objects (`{ ne: … }`), `OR`/`AND`/`NOT`/`RAW`
 *   and relation filters — none of which the CASL `list` check understands,
 *   so they are rejected rather than half-authorized.
 * - `with` may only name relations in `READABLE_RELATIONS`, one level deep,
 *   as `true`. Auth tables (`accounts`: password hashes + OAuth tokens,
 *   `sessions`: session tokens) are never readable through this API.
 * - Every returned row — and every loaded relation row — is re-checked with
 *   CASL `read`. Rows the caller may not read are dropped (lists) or treated
 *   as not found (single reads) so existence isn't leaked.
 *
 * Server-only (imports CASL) — dynamic-import it from handlers.
 */

import "@tanstack/react-start/server-only";
import type { EntityType } from "~/lib/entity-types";
import type { SessionUser } from "~/server/auth/auth";
import { defineAbilitiesFor } from "./ability";
import { BadRequestError } from "./http-errors";

type RelationSpec = { subject: EntityType; many: boolean };

/** Relations the generic read API may load, mapped to their CASL subject. */
export const READABLE_RELATIONS: Record<EntityType, Record<string, RelationSpec>> = {
	Task: { user: { subject: "User", many: false } },
	User: { tasks: { subject: "Task", many: true } },
};

type Primitive = string | number | boolean | null;

function isPrimitive(value: unknown): value is Primitive {
	return value === null || ["string", "number", "boolean"].includes(typeof value);
}

export function assertSafeWhere(where: unknown, columnNames: readonly string[]): void {
	if (where === undefined) return;
	if (where === null || typeof where !== "object" || Array.isArray(where)) {
		throw new BadRequestError("where must be an object of column equality filters");
	}
	for (const [key, value] of Object.entries(where)) {
		if (!columnNames.includes(key)) {
			throw new BadRequestError(`Unsupported where key: ${key}`);
		}
		if (value !== undefined && !isPrimitive(value)) {
			throw new BadRequestError(`where.${key} must be a plain value`);
		}
	}
}

export function assertSafeWith(subject: EntityType, withClause: unknown): void {
	if (withClause === undefined) return;
	if (withClause === null || typeof withClause !== "object" || Array.isArray(withClause)) {
		throw new BadRequestError("with must be an object of relation names");
	}
	const allowed = READABLE_RELATIONS[subject];
	for (const [key, value] of Object.entries(withClause)) {
		if (!Object.hasOwn(allowed, key)) {
			throw new BadRequestError(`Relation not readable: ${key}`);
		}
		if (value !== true) {
			throw new BadRequestError(`with.${key} must be true (nested filters are not supported)`);
		}
	}
}

type Row = Record<string, unknown>;

/**
 * Returns the row with unreadable relation rows removed, or `null` when the
 * caller may not read the row itself.
 */
export function filterReadableRow<T extends object>(
	user: SessionUser,
	subject: EntityType,
	row: T,
	withClause: Record<string, unknown> | undefined,
): T | null {
	const ability = defineAbilitiesFor(user);
	const canRead = (rowSubject: EntityType, data: Row) =>
		ability.can("read", { ...data, __caslSubjectType__: rowSubject });

	const source = row as Row;
	if (!canRead(subject, source)) return null;
	if (!withClause) return row;

	const result: Row = { ...source };
	for (const key of Object.keys(withClause)) {
		const spec = READABLE_RELATIONS[subject][key];
		if (!spec) continue;
		const value = source[key];
		if (spec.many) {
			result[key] = Array.isArray(value) ? value.filter((child) => canRead(spec.subject, child as Row)) : [];
		} else {
			result[key] = value && canRead(spec.subject, value as Row) ? value : null;
		}
	}
	return result as T;
}

export function filterReadableRows<T extends object>(
	user: SessionUser,
	subject: EntityType,
	rows: T[],
	withClause: Record<string, unknown> | undefined,
): T[] {
	return rows.flatMap((row) => {
		const filtered = filterReadableRow(user, subject, row, withClause);
		return filtered ? [filtered] : [];
	});
}
