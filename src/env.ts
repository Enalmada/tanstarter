/**
 * Environment variable configuration using envin
 * Type-safe environment variables with validation
 */

import envConfig from "../env.config";

// Re-export the env object from envin config
export const env = envConfig;

// For build-time environment checks (safe to use in global context)
export const buildEnv = {
	isDev:
		process.env.NODE_ENV === "development" || (typeof import.meta !== "undefined" && import.meta.env?.DEV) || false,
	isProd:
		process.env.NODE_ENV === "production" || (typeof import.meta !== "undefined" && import.meta.env?.PROD) || false,
	mode: (typeof import.meta !== "undefined" && import.meta.env?.MODE) || process.env.NODE_ENV || "development",
} as const;

// Helper functions for environment detection
export function getAppEnv() {
	// Use envin's validated APP_ENV if available
	if (env.APP_ENV) {
		return env.APP_ENV;
	}

	// Fallback to NODE_ENV-based detection
	if (env.NODE_ENV === "production") {
		return "production";
	}

	return "development";
}

export const isProduction = () => getAppEnv() === "production";
export const isStaging = () => getAppEnv() === "staging";
export const isPreview = () => getAppEnv() === "preview";
export const isDevelopment = () => getAppEnv() === "development";
export const shouldReportErrors = () => !isDevelopment();
export const useProductionServices = () => isProduction() || isStaging();

// Database helpers
export const dbHelpers = {
	getDatabaseUrl: () => env.DATABASE_URL,
	getMaxRetries: () => env.DB_MAX_RETRIES?.toString(),
	getRetryInterval: () => env.DB_RETRY_INTERVAL?.toString(),
} as const;
