// @vitest-environment node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { describe, expect, it } from "vitest";
import { defaultMigrationsFolder, readRetryConfig, resolveMigrationConnection } from "../migrate";

const NEON = "postgres://app:p%40ss@ep-cool-1.us-east-2.aws.neon.tech/neondb";

describe("resolveMigrationConnection", () => {
	it("verifies TLS for a remote host even when the URL says sslmode=require", () => {
		const connection = resolveMigrationConnection(`${NEON}?sslmode=require`);
		expect(connection.ssl).toBe("verify-full");
		expect(new URL(connection.url).searchParams.has("sslmode")).toBe(false);
	});

	it("drops channel_binding, which postgres.js would send to the server as a setting", () => {
		const url = new URL(resolveMigrationConnection(`${NEON}?sslmode=require&channel_binding=require`).url);
		expect(url.searchParams.has("channel_binding")).toBe(false);
	});

	it("keeps other parameters and the encoded password", () => {
		const url = new URL(resolveMigrationConnection(`${NEON}?options=endpoint%3Dep-cool-1`).url);
		expect(url.searchParams.get("options")).toBe("endpoint=ep-cool-1");
		expect(url.password).toBe("p%40ss");
	});

	it("switches a Neon pooler host to the direct host", () => {
		const connection = resolveMigrationConnection(NEON.replace("ep-cool-1.", "ep-cool-1-pooler."));
		expect(new URL(connection.url).hostname).toBe("ep-cool-1.us-east-2.aws.neon.tech");
		expect(connection.switchedFromPooler).toBe(true);
	});

	it("leaves a -pooler host outside Neon alone", () => {
		const connection = resolveMigrationConnection("postgres://u:p@db-pooler.example.com/x");
		expect(new URL(connection.url).hostname).toBe("db-pooler.example.com");
		expect(connection.switchedFromPooler).toBe(false);
	});

	it.each(["localhost", "127.0.0.1", "db.localtest.me", "host.docker.internal"])("uses no TLS for %s", (host) => {
		expect(resolveMigrationConnection(`postgres://u:p@${host}:5434/x`).ssl).toBe(false);
	});

	it("honours sslmode=disable", () => {
		expect(resolveMigrationConnection("postgres://u:p@postgres_tanstarter:5432/x?sslmode=disable").ssl).toBe(false);
	});
});

describe("readRetryConfig", () => {
	it("defaults to 10 attempts a second apart", () => {
		expect(readRetryConfig({})).toEqual({ attempts: 10, intervalMs: 1000 });
	});

	it("reads the env overrides and ignores invalid values", () => {
		expect(readRetryConfig({ DB_MAX_RETRIES: "3", DB_RETRY_INTERVAL: "250" })).toEqual({
			attempts: 3,
			intervalMs: 250,
		});
		expect(readRetryConfig({ DB_MAX_RETRIES: "abc", DB_RETRY_INTERVAL: "0" })).toEqual({
			attempts: 10,
			intervalMs: 1000,
		});
	});
});

describe("defaultMigrationsFolder", () => {
	it("points at the committed migrations, whatever the working directory", () => {
		const folder = defaultMigrationsFolder();
		expect(folder.endsWith(path.join("src", "server", "db", "migrations"))).toBe(true);
		expect(readMigrationFiles({ migrationsFolder: folder }).length).toBeGreaterThan(0);
	});
});

// The deploy relies on the exit code: a non-zero exit is what aborts it.
describe("migrate CLI", () => {
	const script = fileURLToPath(new URL("../migrate.ts", import.meta.url));
	// --no-env-file: never pick up the developer's .env database
	const run = (env: NodeJS.ProcessEnv) =>
		spawnSync("bun", ["--no-env-file", script], { encoding: "utf8", env, timeout: 30_000 });

	it("exits 1 when the database is unreachable", { timeout: 30_000 }, () => {
		const result = run({
			...process.env,
			DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:1/none",
			DB_MAX_RETRIES: "1",
		});
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Database not reachable");
	});

	it("exits 1 without DATABASE_URL", { timeout: 30_000 }, () => {
		const env = { ...process.env };
		delete env.DATABASE_URL;
		const result = run(env);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("DATABASE_URL is not set");
	});
});
