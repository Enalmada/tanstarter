/**
 * Applies pending Drizzle migrations.
 *
 * - Locally and in CI, `bun run drizzle:migrate` runs this file.
 * - On Fly, `bun run build` also bundles it to .output/migrate/migrate.mjs with the
 *   migrations copied next to it (`build:migrate`). fly.toml's release_command runs
 *   that bundle once per deploy, before any app Machine is replaced; a non-zero
 *   exit aborts the deploy.
 *
 * It uses postgres.js over TCP, not the app's neon-http driver: neon-http can't run
 * a migration in a transaction, so a failure halfway left a partly applied,
 * unrecorded migration that the next deploy tripped over. Here all pending
 * migrations run in one transaction, under an advisory lock so two deploys never
 * migrate at once.
 *
 * It reads process.env rather than ~/env: it needs only DATABASE_URL, it is bundled
 * on its own, and a deploy shouldn't fail here over an unrelated app variable.
 * Nothing here may depend on NODE_ENV, which `bun build` inlines at build time.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "host.docker.internal"]);

type MigrationConnection = { url: string; ssl: false | "verify-full"; switchedFromPooler: boolean };

/** The migrations folder next to this file: src/server/db/migrations, or .output/migrate/migrations in the bundle. */
export function defaultMigrationsFolder(): string {
	return path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");
}

/**
 * postgres.js settings for DATABASE_URL.
 * - TLS with certificate checks, except on a local host or with an explicit
 *   sslmode=disable. (postgres.js reads Neon's sslmode=require as "encrypt but
 *   don't verify".)
 * - Drops channel_binding: postgres.js sends URL parameters it doesn't know to the
 *   server as settings, and Postgres rejects that one.
 * - Neon's direct host instead of its -pooler host: the pooler (PgBouncer,
 *   transaction mode) doesn't keep session advisory locks, and Neon recommends a
 *   direct connection for migrations.
 */
export function resolveMigrationConnection(databaseUrl: string): MigrationConnection {
	const url = new URL(databaseUrl);
	const sslDisabled = url.searchParams.get("sslmode") === "disable";
	url.searchParams.delete("sslmode");
	url.searchParams.delete("channel_binding");

	const [endpoint = "", ...domain] = url.hostname.split(".");
	const switchedFromPooler = url.hostname.endsWith(".neon.tech") && endpoint.endsWith("-pooler");
	if (switchedFromPooler) {
		url.hostname = [endpoint.slice(0, -"-pooler".length), ...domain].join(".");
	}

	const local =
		LOCAL_HOSTS.has(url.hostname) || url.hostname === "localtest.me" || url.hostname.endsWith(".localtest.me");
	return { url: url.toString(), ssl: sslDisabled || local ? false : "verify-full", switchedFromPooler };
}

/** DB_MAX_RETRIES / DB_RETRY_INTERVAL (ms) for the first connection; Neon may be waking a suspended compute. */
export function readRetryConfig(env: Record<string, string | undefined>) {
	const positive = (value: string | undefined, fallback: number) => {
		const parsed = Number(value);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	};
	return { attempts: positive(env.DB_MAX_RETRIES, 10), intervalMs: positive(env.DB_RETRY_INTERVAL, 1000) };
}

const log = (message: string) => process.stdout.write(`[migrate] ${message}\n`);

function describeError(error: unknown): string {
	if (!(error instanceof Error)) return String(error);
	// Drizzle wraps driver errors: its message names the failed statement, the cause says why.
	// Network failures (ECONNREFUSED) can have an empty message, so fall back to the code or name.
	const cause = error.cause instanceof Error ? error.cause : undefined;
	const code = cause && "code" in cause ? ` [${String(cause.code)}]` : "";
	const label = (e: Error) => e.message || ("code" in e ? String(e.code) : e.name);
	return cause ? `${label(error)}\n${label(cause)}${code}` : label(error);
}

async function waitForDatabase(sql: postgres.Sql, { attempts, intervalMs }: ReturnType<typeof readRetryConfig>) {
	for (let attempt = 1; ; attempt++) {
		try {
			await sql`select 1`;
			return;
		} catch (error) {
			if (attempt >= attempts) {
				throw new Error(`Database not reachable after ${attempt} attempt(s): ${describeError(error)}`);
			}
			log(`Database not reachable yet (attempt ${attempt} of ${attempts}): ${describeError(error)}`);
			await new Promise((resolve) => setTimeout(resolve, intervalMs));
		}
	}
}

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error("DATABASE_URL is not set");

	const migrationsFolder = defaultMigrationsFolder();
	// Throws if the folder is missing; an empty one means the build didn't copy the migrations
	const migrationCount = readMigrationFiles({ migrationsFolder }).length;
	if (migrationCount === 0) throw new Error(`No migrations found in ${migrationsFolder}`);

	const connection = resolveMigrationConnection(databaseUrl);
	if (connection.switchedFromPooler) log("DATABASE_URL uses Neon's pooler; migrating through the direct host");

	const sql = postgres(connection.url, {
		ssl: connection.ssl,
		max: 1, // one connection, so the advisory lock and the migration share a session
		connect_timeout: 10,
		onnotice: () => undefined, // "schema already exists, skipping" on every run
		connection: { application_name: "tanstarter-migrate" },
	});
	try {
		await waitForDatabase(sql, readRetryConfig(process.env));
		// Waits while another deploy migrates. Released when the connection closes,
		// including when Fly kills the release Machine at its timeout.
		await sql`select pg_advisory_lock(7310441)`;
		const [started] = await sql<{ started_at: string }[]>`select now()::text as started_at`;
		if (!started) throw new Error("Could not read the database clock");
		log(`Checking ${migrationCount} migration(s) in ${migrationsFolder}`);
		try {
			await migrate(drizzle({ client: sql }), { migrationsFolder });
		} catch (error) {
			log("Migration failed; pending migrations run in one transaction, so the schema is unchanged.");
			throw error;
		}
		const applied = await sql<{ name: string }[]>`
			select name from drizzle.__drizzle_migrations where applied_at >= ${started.started_at}::timestamptz order by id`;
		log(
			applied.length === 0
				? "No pending migrations"
				: `Applied ${applied.length}: ${applied.map((row) => row.name).join(", ")}`,
		);
	} finally {
		await sql.end({ timeout: 5 });
	}
}

if (import.meta.main) {
	main().catch((error: unknown) => {
		process.stderr.write(`[migrate] Failed: ${describeError(error)}\n`);
		process.exitCode = 1;
	});
}
