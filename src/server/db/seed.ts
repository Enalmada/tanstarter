/**
 * Database seeding script
 * Populates the database with initial data for development
 */

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { dbHelpers } from "~/env";

// Configure for local development with Neon HTTP proxy
if (process.env.NODE_ENV === "development") {
	neonConfig.fetchEndpoint = (host) => {
		const [protocol, port] = host === "db.localtest.me" ? ["http", 4444] : ["https", 443];
		return `${protocol}://${host}:${port}/sql`;
	};
}

export const seedDatabase = async (): Promise<void> => {
	if (!dbHelpers.getDatabaseUrl()) {
		throw new Error("DATABASE_URL is not defined");
	}

	const sql = neon(dbHelpers.getDatabaseUrl());
	const _db = drizzle(sql);
};

// Auto-run if this is the main module
if (require.main === module) {
	seedDatabase().catch((_err) => {
		process.exit(1);
	});
}
