/**
 * Environment variable configuration and validation
 * Uses Valibot for runtime type checking of env vars
 * Exports typed env object for use throughout the app
 */

"use server";

declare global {
	var __env__: Record<string, string> | undefined;
}

export const required = [
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"DATABASE_URL",
] as const;

export const optional = [
	"DB_RETRY_INTERVAL",
	"DB_MAX_RETRIES",
	"NODE_ENV",
	"CF_PAGES_URL",
	"AXIOM_DATASET_NAME",
	"AXIOM_TOKEN",
	"VITE_APP_BASE_URL",
	"PUBLIC_ROLLBAR_ACCESS_TOKEN",
] as const;

type RequiredEnvKeys = (typeof required)[number];
type OptionalEnvKeys = (typeof optional)[number];
type EnvKeys = RequiredEnvKeys | OptionalEnvKeys;

// For build-time environment checks (safe to use in global context)
export const buildEnv = {
	isDev:
		process.env.NODE_ENV === "development" ||
		(typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
		false,
	isProd:
		process.env.NODE_ENV === "production" ||
		(typeof import.meta !== "undefined" && import.meta.env?.PROD) ||
		false,
	mode:
		(typeof import.meta !== "undefined" && import.meta.env?.MODE) ||
		process.env.NODE_ENV ||
		"development",
} as const;

// For runtime environment variables
export const env = new Proxy(
	{} as Record<RequiredEnvKeys, string> &
		Partial<Record<OptionalEnvKeys, string | undefined>>,
	{
		get: (_target, prop: string) => {
			// In development, use process.env
			if (process.env.NODE_ENV === "development") {
				return process.env[prop] || "";
			}

			// In production (Cloudflare Pages), try __env__ first, then process.env
			if (typeof globalThis.__env__ !== "undefined") {
				return globalThis.__env__[prop] || process.env[prop] || "";
			}

			// Fallback to process.env if nothing else works
			return process.env[prop] || "";
		},
	},
);

// Add debug function to help troubleshoot env access
export function debugEnv(key: EnvKeys) {
	return {
		environment: process.env.NODE_ENV,
		processEnv: process.env[key],
		cloudflareEnv: globalThis.__env__?.[key],
		finalValue: env[key],
	};
}

// Validation function for development only
export function validateEnv() {
	if (buildEnv.isProd) return;

	const missing: string[] = [];

	for (const key of required) {
		const value = env[key];
		if (!value || value.trim() === "") {
			missing.push(key);
		}
	}

	if (missing.length > 0) {
		throw new Error(
			`Missing or empty required environment variables:\n${missing.join("\n")}`,
		);
	}
}

export const dbHelpers = {
	getDatabaseUrl: () => env.DATABASE_URL,
	getMaxRetries: () => env.DB_MAX_RETRIES,
	getRetryInterval: () => env.DB_RETRY_INTERVAL,
} as const;
