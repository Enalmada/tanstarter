/**
 * Post-Build Script
 *
 * This script runs after successful builds to perform additional tasks:
 * - Uploads source maps to Rollbar if ROLLBAR_SERVER_TOKEN is configured
 * - Additional post-build tasks can be added here
 *
 * It's configured to run via the build:prod script in package.json
 */

import { isSourceMapUploadConfigured, notifyRollbarDeploy } from "../src/lib/monitoring/deploy";

async function postBuild() {
	if (!isSourceMapUploadConfigured()) {
		return;
	}

	try {
		await notifyRollbarDeploy();
	} catch (error) {
		if (error instanceof Error) {
		}
	}
}

postBuild().catch((error) => {
	process.stderr.write(`Post-build error: ${error}\n`);
	process.exit(1);
});
