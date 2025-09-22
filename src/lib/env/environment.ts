import { picklist, safeParse } from "valibot";

const environments = [
	"development",
	"preview",
	"staging",
	"production",
] as const;
export const AppEnvironment = picklist(environments);

export type AppEnvironment = (typeof environments)[number];

/**
 * Get the current application environment
 * Priority:
 * 1. Cloudflare Pages branch inference (in production)
 * 2. Explicit APP_ENV setting (in development)
 * 3. Default to development
 */
export const getAppEnv = (): AppEnvironment => {
	// In production, always use Cloudflare Pages branch if available
	if (process.env.NODE_ENV === "production" && process.env.CF_PAGES_BRANCH) {
		switch (process.env.CF_PAGES_BRANCH) {
			case "main":
				return "production";
			case "dev":
				return "staging";
			default:
				return "preview";
		}
	}

	// In development, use explicit APP_ENV if valid
	if (process.env.APP_ENV) {
		const result = safeParse(AppEnvironment, process.env.APP_ENV);
		if (result.success) {
			return result.output;
		}
	}
	return "development";
};

/**
 * Check if the current environment is a production environment
 */
export const isProduction = () => getAppEnv() === "production";

/**
 * Check if the current environment is a staging environment
 */
export const isStaging = () => getAppEnv() === "staging";

/**
 * Check if the current environment is a preview environment
 */
export const isPreview = () => getAppEnv() === "preview";

/**
 * Check if the current environment is a development environment
 */
export const isDevelopment = () => getAppEnv() === "development";

/**
 * Check if the current environment should report errors to monitoring
 */
export const shouldReportErrors = () => !isDevelopment();

/**
 * Check if the current environment should use production services
 * (staging and production use production services)
 */
export const useProductionServices = () => isProduction() || isStaging();
