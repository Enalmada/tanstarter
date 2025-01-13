/**
 * Database connection configuration
 * Sets up and exports database client instance
 * Configures connection pooling and SSL settings
 */

// db/index.ts
"use server";

import { Pool } from "@neondatabase/serverless";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import { buildEnv, env } from "~/env";
import * as schema from "./schema";

// More specific type that includes your schema
type DB = ReturnType<typeof drizzle<typeof schema>>;

// Use build-time env check for global context
if (buildEnv.isDev) {
	neonConfig.fetchEndpoint = (host) => {
		const [protocol, port] =
			host === "db.localtest.me" ? ["http", 4444] : ["https", 443];
		return `${protocol}://${host}:${port}/sql`;
	};
}

let _db: DB | undefined;

function getDb(): DB {
	if (!_db) {
		// Use env helper for DATABASE_URL
		const dbUrl = env.DATABASE_URL;
		if (!dbUrl) {
			throw new Error("DATABASE_URL not available");
		}
		const neonClient = neon(dbUrl);
		_db = drizzle(neonClient, { schema });
	}
	return _db;
}

// Properly type the proxy
const db = new Proxy({} as DB, {
	get: (target, prop: keyof DB | symbol) => {
		const db = getDb();
		return db[prop as keyof DB];
	},
});

export default db;

// Generic transaction wrapper
export async function withTransaction<T>(
	operation: (
		db: ReturnType<typeof drizzleServerless<typeof schema>>,
	) => Promise<T>,
): Promise<T> {
	let pool: Pool | undefined;
	try {
		// biome-ignore lint/suspicious/noConsoleLog: Debugging transaction issues
		console.log("Creating pool for transaction");
		pool = new Pool({ connectionString: env.DATABASE_URL });

		// biome-ignore lint/suspicious/noConsoleLog: Debugging transaction issues
		console.log("Creating drizzle instance");
		const dbWithTx = drizzleServerless(pool, { schema });

		// biome-ignore lint/suspicious/noConsoleLog: Debugging transaction issues
		console.log("Starting operation");
		return await operation(dbWithTx);
	} catch (error) {
		console.error("Transaction error:", {
			error,
			message: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	} finally {
		if (pool) {
			// biome-ignore lint/suspicious/noConsoleLog: Debugging transaction issues
			console.log("Closing pool");
			await pool.end().catch(console.error);
		}
	}
}

// Add debug function to help troubleshoot database connections
export async function debugDb() {
	return {
		environment: process.env.NODE_ENV,
		hasDbUrl: !!env.DATABASE_URL,
		dbUrlLength: env.DATABASE_URL?.length || 0,
		isDev: buildEnv.isDev,
		isProd: buildEnv.isProd,
	};
}

// Export types
export type { DB };
