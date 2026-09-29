/**
 * Get release information for the current deployment
 * Used by:
 * - PostHog server error tracking (`app_release` on exceptions)
 * - Debug information
 */

import { env } from "~/env";

// Get release info from environment or Fly.io deployment
export const getRelease = () => {
	// First try explicit release version (set during CI/deployment with Git SHA)
	if (process.env.RELEASE_VERSION) {
		return process.env.RELEASE_VERSION;
	}

	// Then try Fly.io machine version (updates when Docker image changes)
	if (env.FLY_MACHINE_VERSION) {
		return env.FLY_MACHINE_VERSION;
	}

	// Or try Fly.io image ref (contains deployment identifier)
	if (env.FLY_IMAGE_REF) {
		// Extract deployment ID from registry.fly.io/app:deployment-XXXXX
		const deploymentId = env.FLY_IMAGE_REF.split(":").pop() || env.FLY_IMAGE_REF;
		return deploymentId;
	}

	// Then try APP_ENV
	if (env.APP_ENV) {
		return env.APP_ENV;
	}

	// Finally fallback to development
	return "development";
};
