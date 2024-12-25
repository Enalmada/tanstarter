// db/index.ts
"use server";

import { Pool } from "@neondatabase/serverless";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import { buildEnv, dbHelpers } from "~/env";
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
		const dbUrl = dbHelpers.getDatabaseUrl();
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
	const pool = new Pool({ connectionString: dbHelpers.getDatabaseUrl() });
	const dbWithTx = drizzleServerless(pool, { schema });

	try {
		return await operation(dbWithTx);
	} finally {
		await pool.end();
	}
}

// Export types
export type { DB };
