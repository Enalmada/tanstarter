"use server";
import { Pool } from "@neondatabase/serverless";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Configure for local development with Neon HTTP proxy
if (process.env.NODE_ENV === "development") {
	neonConfig.fetchEndpoint = (host) => {
		const [protocol, port] =
			host === "db.localtest.me" ? ["http", 4444] : ["https", 443];
		return `${protocol}://${host}:${port}/sql`;
	};
}

const neonClient = neon(process.env.DATABASE_URL!);
export const db = drizzle(neonClient, { schema });

type DB = typeof db;

// Generic transaction wrapper
export async function withTransaction<T>(
	operation: (db: ReturnType<typeof drizzleServerless>) => Promise<T>,
): Promise<T> {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const dbWithTx = drizzleServerless(pool, { schema });

	try {
		return await operation(dbWithTx);
	} finally {
		await pool.end();
	}
}

export type Database = typeof db;
