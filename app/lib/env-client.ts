/**
 * Client-side environment variable access
 * Uses import.meta.env for client-side safety
 *
 * Environment Variables:
 * - APP_ENV: Application environment (development, preview, staging, production)
 * - MODE: Vite's equivalent of NODE_ENV, automatically set based on command
 * - PUBLIC_*: Client-safe variables that are exposed to the browser
 * - CF_PAGES_*: Cloudflare Pages deployment information
 */

// Define the shape of our client-side environment
interface ClientEnv {
	// Application environment (development, preview, staging, production)
	APP_ENV?: string;
	// Error monitoring
	PUBLIC_ROLLBAR_ACCESS_TOKEN: string;
	// Vite's MODE is automatically set based on the command:
	// - development: bun run dev
	// - production: bun run build
	NODE_ENV: string;
	// Cloudflare Pages deployment info - all optional since they're only available in production
	CF_PAGES_BRANCH?: string;
	CF_PAGES_COMMIT_SHA?: string;
	CF_PAGES_URL?: string;
}

// Additional Vite-specific environment variables
type ViteEnvVar = "MODE";

// Helper to safely get environment variables with fallbacks
const getEnvVar = (
	key: keyof ClientEnv | ViteEnvVar,
	fallback = "",
): string => {
	return (import.meta.env[key] as string | undefined) || fallback;
};

export const clientEnv: ClientEnv = {
	// Application environment
	APP_ENV: getEnvVar("APP_ENV"),
	// Error monitoring
	PUBLIC_ROLLBAR_ACCESS_TOKEN: getEnvVar("PUBLIC_ROLLBAR_ACCESS_TOKEN"),
	// Vite's MODE maps to NODE_ENV (development/production)
	NODE_ENV: getEnvVar("MODE", "development"),
	// Cloudflare Pages deployment info
	CF_PAGES_BRANCH: getEnvVar("CF_PAGES_BRANCH"),
	CF_PAGES_COMMIT_SHA: getEnvVar("CF_PAGES_COMMIT_SHA"),
	CF_PAGES_URL: getEnvVar("CF_PAGES_URL"),
} as const;
