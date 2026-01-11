import type { PgTableWithColumns } from "drizzle-orm/pg-core";

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

/**
 * Build a where clause object for Drizzle ORM v1 RQBv2.
 * Returns an object-based filter that can be passed directly to findMany/findFirst.
 */
export const buildWhereClause = <T>(
	// biome-ignore lint/suspicious/noExplicitAny: Using any here is necessary for generic table operations
	_tableOrQuery: PgTableWithColumns<any> | { table: PgTableWithColumns<any> },
	criteria?: Partial<T>,
): Record<string, unknown> | undefined => {
	if (!criteria) return undefined;

	// Filter out undefined values and return the criteria object directly
	// Drizzle v1 RQBv2 uses object-based where clauses
	const filteredCriteria: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(criteria)) {
		if (value !== undefined) {
			filteredCriteria[key] = value;
		}
	}

	return Object.keys(filteredCriteria).length > 0 ? filteredCriteria : undefined;
};

export const buildOrderByClause = (
	// biome-ignore lint/suspicious/noExplicitAny: Using any here is necessary for generic table operations
	table: PgTableWithColumns<any>,
	order: OrderBy | undefined,
) => {
	if (!order?.sortBy) return undefined;

	return order.sortOrder === "asc" ? table[order.sortBy].asc() : table[order.sortBy].desc();
};
