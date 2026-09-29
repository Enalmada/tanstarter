/**
 * @vitest-environment node
 */

import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { describe, expect, it, vi } from "vitest";
import { relations } from "~/server/db/schema/relations";
import { authAdapterSchema } from "../adapter-schema";

/**
 * With joins on, the relations-v2 adapter asks Drizzle for related rows by
 * relation name (`with: { accounts: true }`). If those names do not exist in
 * db/schema/relations.ts, Drizzle throws at runtime: password sign-in
 * (user + accounts) and uncached session lookups (session + user). This runs the
 * adapter against a stub `db` and checks every requested relation exists.
 */
type Query = { with?: Record<string, unknown> };

function setup() {
	const calls: { table: string; method: string; query: Query }[] = [];
	const query: Record<string, unknown> = {};
	for (const table of Object.keys(relations)) {
		const record =
			(method: string) =>
			async (arg: Query = {}) => {
				calls.push({ table, method, query: arg });
				return method === "findMany" ? [] : undefined;
			};
		query[table] = { findFirst: vi.fn(record("findFirst")), findMany: vi.fn(record("findMany")) };
	}
	// Only the pieces the adapter reads: `_.relations` (relation keys) and `query`
	const db = { _: { relations }, query };

	const auth = betterAuth({
		// biome-ignore lint/suspicious/noExplicitAny: stub db, only the adapter's reads are provided
		database: drizzleAdapter(db as any, { provider: "pg", schema: authAdapterSchema }),
		secret: "test-secret-that-is-at-least-32-characters",
		baseURL: "http://localhost:3000",
		emailAndPassword: { enabled: true },
		advanced: { database: { joins: true } },
	});
	return { auth, calls };
}

function expectKnownRelations(calls: { table: string; query: Query }[]) {
	const joined = calls.filter((call) => call.query.with);
	expect(joined.length).toBeGreaterThan(0);
	for (const { table, query } of joined) {
		const known = Object.keys(
			(relations as Record<string, { relations: Record<string, unknown> }>)[table]?.relations ?? {},
		);
		for (const name of Object.keys(query.with ?? {})) {
			expect(known, `relation "${name}" requested on ${table}`).toContain(name);
		}
	}
}

describe("better-auth joins with the relations-v2 adapter", () => {
	it("looks up a user with its accounts (password sign-in) through defined relations", async () => {
		const { auth, calls } = setup();
		const ctx = await auth.$context;
		await ctx.internalAdapter.findUserByEmail("someone@example.test", { includeAccounts: true });
		expectKnownRelations(calls);
		expect(calls.some((call) => call.table === "UserTable" && call.query.with && "accounts" in call.query.with)).toBe(
			true,
		);
	});

	it("looks up a session with its user (uncached getSession) through defined relations", async () => {
		const { auth, calls } = setup();
		const ctx = await auth.$context;
		await ctx.internalAdapter.findSession("token");
		expectKnownRelations(calls);
		expect(calls.some((call) => call.table === "SessionTable" && call.query.with && "user" in call.query.with)).toBe(
			true,
		);
	});
});
