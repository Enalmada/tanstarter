import { and, eq, type SQL } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";

type CriteriaType<T> = keyof T;

export interface OrderBy {
	sortBy: string;
	sortOrder: "asc" | "desc";
}

export interface Config<T> {
	criteria?: Partial<T>;
	order?: OrderBy;
	limit?: number;
	offset?: number;
}

export const buildWhereClause = <T>(
	// biome-ignore lint/suspicious/noExplicitAny: Using any here is necessary for generic table operations
	tableOrQuery: PgTableWithColumns<any> | { table: PgTableWithColumns<any> },
	criteria?: Partial<T>,
): SQL | undefined => {
	const table = "table" in tableOrQuery ? tableOrQuery.table : tableOrQuery;

	const conditions = criteria
		? Object.keys(criteria)
				.filter((key) => criteria[key as CriteriaType<T>] !== undefined)
				.map((key) => {
					const criteriaType = key as CriteriaType<T>;
					const value = criteria[criteriaType];
					if (value === undefined) return undefined;
					return eq(table[criteriaType], value);
				})
				.filter(
					(condition): condition is NonNullable<typeof condition> =>
						condition !== undefined,
				)
		: [];

	if (conditions.length === 0) return undefined;
	if (conditions.length === 1) {
		return conditions[0];
	}
	return and(...conditions);
};

export const buildOrderByClause = (
	// biome-ignore lint/suspicious/noExplicitAny: Using any here is necessary for generic table operations
	table: PgTableWithColumns<any>,
	order: OrderBy | undefined,
) => {
	if (!order?.sortBy) return undefined;

	return order.sortOrder === "asc"
		? table[order.sortBy].asc()
		: table[order.sortBy].desc();
};
