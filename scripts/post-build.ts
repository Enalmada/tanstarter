/**
 * Post-Build Script
 *
 * This script runs after successful builds to perform additional tasks:
 * - Notifies Rollbar about the deployment for error tracking
 * - Additional post-build tasks can be added here
 *
 * It's configured to run via the build:prod script in package.json
 */

import { notifyRollbarDeploy } from "../app/lib/monitoring/deploy";

async function postBuild() {
	// Add any other post-build steps here
	await notifyRollbarDeploy();
}

postBuild().catch(console.error);
