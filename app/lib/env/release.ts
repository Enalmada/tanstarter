/**
 * Get release information for the current deployment
 * Used by:
 * - Rollbar error monitoring
 * - Source map uploads
 * - Debug information
 */

// Get release info from Cloudflare Pages or use APP_ENV
export const getRelease = () => {
	if (process.env.CF_PAGES_COMMIT_SHA) {
		return `${process.env.CF_PAGES_BRANCH}@${process.env.CF_PAGES_COMMIT_SHA}`;
	}
	return process.env.APP_ENV || "development";
};

// Debug helper for Rollbar configuration
export const getRollbarDebugInfo = () => ({
	token: process.env.ROLLBAR_SERVER_TOKEN ? "set" : "not set",
	baseUrl: process.env.CF_PAGES_URL || "http://localhost:3000",
	version: getRelease(),
});
