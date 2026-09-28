/**
 * Database seeding script (`bun run drizzle:seed`).
 *
 * Seeds the Playwright e2e users (see ~/utils/test/playwright-users). It's
 * idempotent: existing users get their role and verification re-applied.
 * Development databases only; this never runs as part of a deploy.
 */

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { dbHelpers } from "~/env";
import { UserRole } from "~/lib/enums/user-role";
import { UserTable } from "~/server/db/schema";
import { PLAYWRIGHT_ADMIN_USER, PLAYWRIGHT_MEMBER_USER } from "~/utils/test/playwright-users";

// Configure for local development with Neon HTTP proxy
if (process.env.NODE_ENV === "development") {
	neonConfig.fetchEndpoint = (host) => {
		const [protocol, port] = host === "db.localtest.me" ? ["http", 4444] : ["https", 443];
		return `${protocol}://${host}:${port}/sql`;
	};
}

const LOCAL_DB_HOSTS = new Set(["db.localtest.me", "localhost", "127.0.0.1", "::1", "[::1]"]);

export const seedDatabase = async (): Promise<void> => {
	if (process.env.NODE_ENV !== "development") {
		throw new Error("drizzle:seed only runs against a development database (NODE_ENV=development)");
	}
	if (!dbHelpers.getDatabaseUrl()) {
		throw new Error("DATABASE_URL is not defined");
	}
	// NODE_ENV alone isn't enough: a production DATABASE_URL in .env would still
	// get test accounts (one of them an admin), so require a local database too.
	const { hostname } = new URL(dbHelpers.getDatabaseUrl());
	if (!LOCAL_DB_HOSTS.has(hostname)) {
		throw new Error(`drizzle:seed only runs against a local database, not ${hostname}`);
	}

	const neonClient = neon(dbHelpers.getDatabaseUrl());
	const db = drizzle({ client: neonClient });

	for (const [user, role] of [
		[PLAYWRIGHT_MEMBER_USER, UserRole.MEMBER],
		[PLAYWRIGHT_ADMIN_USER, UserRole.ADMIN],
	] as const) {
		await db
			.insert(UserTable)
			.values({ email: user.email, name: user.name, emailVerified: true, role })
			.onConflictDoUpdate({ target: UserTable.email, set: { role, emailVerified: true } });
		process.stdout.write(`Seeded ${user.email} (${role})\n`);
	}
};

// Auto-run if this is the main module
if (import.meta.main) {
	seedDatabase().catch((err) => {
		process.stderr.write(`Seed failed: ${err instanceof Error ? err.message : String(err)}\n`);
		process.exit(1);
	});
}
