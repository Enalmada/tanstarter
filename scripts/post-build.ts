/**
 * Post-Build Script
 *
 * This script runs after successful builds to perform additional tasks:
 * - Uploads source maps to Rollbar if ROLLBAR_SERVER_TOKEN is configured
 * - Additional post-build tasks can be added here
 *
 * It's configured to run via the build:prod script in package.json
 */

import {
	isSourceMapUploadConfigured,
	notifyRollbarDeploy,
} from "../app/lib/monitoring/deploy";

async function postBuild() {
	console.info("=== Starting post-build script ===");

	if (!isSourceMapUploadConfigured()) {
		console.info(
			"Skipping source map upload - ROLLBAR_SERVER_TOKEN not configured",
		);
		return;
	}

	console.info("Environment:", {
		CF_PAGES: process.env.CF_PAGES,
		CF_PAGES_BRANCH: process.env.CF_PAGES_BRANCH,
		NODE_ENV: process.env.NODE_ENV,
	});

	try {
		console.info("Attempting to upload source maps...");
		await notifyRollbarDeploy();
		console.info("Successfully uploaded source maps");
	} catch (error) {
		console.error("Failed to upload source maps:", error);
		if (error instanceof Error) {
			console.error("Error details:", {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});
		}
	}
	console.info("=== Finished post-build script ===");
}

postBuild().catch(console.error);
