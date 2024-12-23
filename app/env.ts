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

function getEnvVariable(key: EnvKeys): string | undefined {
	// Try all possible ways to get the variable
	return (
		globalThis.context?.env?.[key] || // Cloudflare Pages
		process?.env?.[key] || // Node.js
		""
	); // Fallback empty string
}

// Create a proxy that handles both environments
export const env = new Proxy(
	{} as Record<RequiredEnvKeys, string> &
		Partial<Record<OptionalEnvKeys, string | undefined>>,
	{
		get: (_target, prop: string) => {
			return getEnvVariable(prop as EnvKeys);
		},
	},
);

// Environment helpers
export const envHelpers = {
	isProduction: () => {
		try {
			// @ts-ignore
			return context.env.NODE_ENV === "production";
		} catch {
			return process.env.NODE_ENV === "production";
		}
	},
	isDevelopment: () => {
		try {
			// @ts-ignore
			return context.env.NODE_ENV === "development";
		} catch {
			return process.env.NODE_ENV === "development";
		}
	},
	isTest: () => {
		try {
			// @ts-ignore
			return context.env.NODE_ENV === "test";
		} catch {
			return process.env.NODE_ENV === "test";
		}
	},
} as const;

export const authHelpers = {
	discord: {
		getClientId: () => {
			try {
				// @ts-ignore
				return context.env.DISCORD_CLIENT_ID as string;
			} catch {
				return process.env.DISCORD_CLIENT_ID as string;
			}
		},
		getClientSecret: () => {
			try {
				// @ts-ignore
				return context.env.DISCORD_CLIENT_SECRET as string;
			} catch {
				return process.env.DISCORD_CLIENT_SECRET as string;
			}
		},
		getRedirectUri: () => {
			try {
				// @ts-ignore
				return context.env.DISCORD_REDIRECT_URI as string;
			} catch {
				return process.env.DISCORD_REDIRECT_URI as string;
			}
		},
	},
	github: {
		getClientId: () => {
			try {
				// @ts-ignore
				return context.env.GITHUB_CLIENT_ID as string;
			} catch {
				return process.env.GITHUB_CLIENT_ID as string;
			}
		},
		getClientSecret: () => {
			try {
				// @ts-ignore
				return context.env.GITHUB_CLIENT_SECRET as string;
			} catch {
				return process.env.GITHUB_CLIENT_SECRET as string;
			}
		},
		getRedirectUri: () => {
			try {
				// @ts-ignore
				return context.env.GITHUB_REDIRECT_URI as string;
			} catch {
				return process.env.GITHUB_REDIRECT_URI as string;
			}
		},
	},
	google: {
		getClientId: () => {
			try {
				// @ts-ignore
				return context.env.GOOGLE_CLIENT_ID as string;
			} catch {
				return process.env.GOOGLE_CLIENT_ID as string;
			}
		},
		getClientSecret: () => {
			try {
				// @ts-ignore
				return context.env.GOOGLE_CLIENT_SECRET as string;
			} catch {
				return process.env.GOOGLE_CLIENT_SECRET as string;
			}
		},
		getRedirectUri: () => {
			try {
				// @ts-ignore
				return context.env.GOOGLE_REDIRECT_URI as string;
			} catch {
				return process.env.GOOGLE_REDIRECT_URI as string;
			}
		},
	},
} as const;

export const dbHelpers = {
	getDatabaseUrl: () => {
		try {
			// @ts-ignore
			return context.env.DATABASE_URL;
		} catch {
			return process.env.DATABASE_URL;
		}
	},
	getMaxRetries: () => {
		try {
			// @ts-ignore
			return context.env.DB_MAX_RETRIES;
		} catch {
			return process.env.DB_MAX_RETRIES;
		}
	},
	getRetryInterval: () => {
		try {
			// @ts-ignore
			return context.env.DB_RETRY_INTERVAL;
		} catch {
			return process.env.DB_RETRY_INTERVAL;
		}
	},
} as const;

// Only validate in local development
export function validateEnv() {
	// Skip validation if we're not in Node.js environment
	if (typeof process === "undefined") return;

	// Skip validation in production
	if (envHelpers.isProduction()) return;

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
