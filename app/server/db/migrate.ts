import { neon, neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

export const databaseConfig = {
	RETRY_INTERVAL: process.env.DB_RETRY_INTERVAL
		? Number.parseInt(process.env.DB_RETRY_INTERVAL)
		: 1000,
	MAX_RETRIES: process.env.DB_MAX_RETRIES
		? Number.parseInt(process.env.DB_MAX_RETRIES)
		: 10,
};

// Configure for local development with Neon HTTP proxy
if (process.env.NODE_ENV === "development") {
	neonConfig.fetchEndpoint = (host) => {
		const [protocol, port] =
			host === "db.localtest.me" ? ["http", 4444] : ["https", 443];
		return `${protocol}://${host}:${port}/sql`;
	};
}

const waitUntilDatabaseIsReady = async (
	db: ReturnType<typeof drizzle>,
): Promise<void> => {
	for (let attempts = 0; attempts < databaseConfig.MAX_RETRIES; attempts++) {
		try {
			await db.execute(sql`SELECT 1`);
			return;
		} catch (err) {
			if (attempts === 0) {
				console.info(
					`⏳ Database not ready. Retrying every ${databaseConfig.RETRY_INTERVAL / 1000}s...`,
				);
			} else if (attempts === databaseConfig.MAX_RETRIES - 1) {
				throw new Error("❌  Database not ready after maximum retries");
			}
			await new Promise((resolve) =>
				setTimeout(resolve, databaseConfig.RETRY_INTERVAL),
			);
		}
	}
};

export const runMigrate = async (
	migrationsFolder = "app/server/db/migrations",
): Promise<void> => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not defined");
	}

	const sql = neon(process.env.DATABASE_URL);
	const db = drizzle(sql);

	try {
		await waitUntilDatabaseIsReady(db);

		console.info("⏳  Running migrations...");
		const start = Date.now();
		await migrate(db, { migrationsFolder });
		const end = Date.now();
		console.info(`✅  Migrations completed in ${end - start}ms`);
	} catch (err) {
		console.error("❌  Migration failed", err);
		throw err;
	}
};

// Auto-run if this is the main module
if (require.main === module) {
	runMigrate().catch((err) => {
		console.error("Migration failed:", err);
		process.exit(1);
	});
}
