"use server";

declare global {
	var context:
		| {
				env: Record<string, any>;
		  }
		| undefined;
}

export const required = [
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"GOOGLE_REDIRECT_URI",
	"DATABASE_URL",
] as const;

export const optional = [
	"DB_RETRY_INTERVAL",
	"DB_MAX_RETRIES",
	"DISCORD_CLIENT_ID",
	"DISCORD_CLIENT_SECRET",
	"DISCORD_REDIRECT_URI",
	"GITHUB_CLIENT_ID",
	"GITHUB_CLIENT_SECRET",
	"GITHUB_REDIRECT_URI",
	"NODE_ENV",
] as const;

type RequiredEnvKeys = (typeof required)[number];
type OptionalEnvKeys = (typeof optional)[number];
type EnvKeys = RequiredEnvKeys | OptionalEnvKeys;

// For build-time environment checks (safe to use in global context)
export const buildEnv = {
	isDev: import.meta.env.DEV,
	isProd: import.meta.env.PROD,
	mode: import.meta.env.MODE,
} as const;

// For runtime environment variables (only use within server functions/handlers)
export const env = new Proxy(
	{} as Record<RequiredEnvKeys, string> &
		Partial<Record<OptionalEnvKeys, string | undefined>>,
	{
		get: (_target, prop: string) => {
			// Simple process.env access is fine within server functions
			return process.env[prop] || "";
		},
	},
);

export const dbHelpers = {
	getDatabaseUrl: () => process.env.DATABASE_URL!,
	getMaxRetries: () => process.env.DB_MAX_RETRIES,
	getRetryInterval: () => process.env.DB_RETRY_INTERVAL,
} as const;

// Validation function for development only
export function validateEnv() {
	if (buildEnv.isProd) return;

	const missing: string[] = [];

	for (const key of required) {
		const value = process.env[key];
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
