/**
 * Get release information for the current deployment
 * Used by:
 * - Rollbar error monitoring (runtime)
 * - Source map uploads (build time)
 * - Debug information
 */

import { env } from "~/env";

// Get release info from Cloudflare Pages or use environment
export const getRelease = () => {
	// First try Cloudflare Pages info
	if (env.CF_PAGES_COMMIT_SHA) {
		const release = `${env.CF_PAGES_BRANCH}@${env.CF_PAGES_COMMIT_SHA}`;
		return release;
	}

	// Then try APP_ENV
	if (env.APP_ENV) {
		return env.APP_ENV;
	}

	// Finally fallback to development
	return "development";
};

/**
 * Debug helper for Rollbar configuration during build
 * Only use this in build scripts where process.env is available
 */
export const getRollbarDebugInfo = () => ({
	token: process.env.ROLLBAR_SERVER_TOKEN ? "set" : "not set",
	baseUrl: process.env.CF_PAGES_URL || "http://localhost:3000",
	version: getRelease(),
	environment: {
		CF_PAGES: process.env.CF_PAGES,
		CF_PAGES_URL: process.env.CF_PAGES_URL,
		NODE_ENV: process.env.NODE_ENV,
	},
});
