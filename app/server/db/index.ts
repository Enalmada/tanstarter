"use server";

import { Pool } from "@neondatabase/serverless";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import { dbHelpers, envHelpers } from "~/env";
import * as schema from "./schema";

// biome-ignore lint/style/noVar: <explanation>
declare var context: { env: Record<string, string> };

const neonClient = neon(dbHelpers.getDatabaseUrl());

if (envHelpers.isDevelopment()) {
	neonConfig.fetchEndpoint = (host) => {
		const [protocol, port] =
			host === "db.localtest.me" ? ["http", 4444] : ["https", 443];
		return `${protocol}://${host}:${port}/sql`;
	};
}

export const db = drizzle(neonClient, { schema });

// Generic transaction wrapper
export async function withTransaction<T>(
	operation: (db: ReturnType<typeof drizzleServerless>) => Promise<T>,
): Promise<T> {
	const pool = new Pool({ connectionString: dbHelpers.getDatabaseUrl() });
	const dbWithTx = drizzleServerless(pool, { schema });

	try {
		return await operation(dbWithTx);
	} finally {
		await pool.end();
	}
}

export type Database = typeof db;
