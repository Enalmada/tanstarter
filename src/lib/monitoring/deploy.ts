/**
 * Rollbar Deploy Notification
 *
 * Tells Rollbar a new release was deployed. Runs from scripts/post-build.ts.
 * Source maps are uploaded during `vite build` by scripts/vite-rollbar-sourcemaps.ts.
 *
 * @see https://docs.rollbar.com/reference/post-deploy
 */

import { getBuildRelease } from "../env/build-release";
import { getRelease } from "../env/release";

// ROLLBAR_API_URL points the build at a mock Rollbar (same override as
// scripts/vite-rollbar-sourcemaps.ts).
const ROLLBAR_API = `${(process.env.ROLLBAR_API_URL || "https://api.rollbar.com/api/1").replace(/\/+$/, "")}/deploy`;

// Check if source map upload is configured
export function isSourceMapUploadConfigured(): boolean {
	return Boolean(process.env.ROLLBAR_SERVER_TOKEN);
}

// Interface matching Rollbar's deploy API payload requirements
interface DeployPayload {
	access_token: string;
	environment: string;
	revision: string;
	local_username?: string | undefined;
	rollbar_username?: string | undefined;
	comment?: string | undefined;
	status?: "started" | "succeeded" | "failed" | "timed_out" | undefined;
	date?: string | undefined;
}

/**
 * Notifies Rollbar about a new deployment.
 *
 * This function:
 * 1. Determines the environment (APP_ENV, as reported by the Rollbar clients)
 * 2. Gets the release version
 * 3. Sends deployment data to Rollbar
 * 4. Logs the result with the deploy ID
 *
 * It's designed to run after successful builds via the post-build script.
 */
export async function notifyRollbarDeploy() {
	if (!isSourceMapUploadConfigured()) {
		return;
	}

	const token = process.env.ROLLBAR_SERVER_TOKEN;
	// This check is redundant now but TypeScript needs it
	if (!token) {
		return;
	}

	// Same environment the Rollbar clients report (APP_ENV), so the deploy shows
	// up alongside its items. The Cloudflare Pages branch is the legacy fallback.
	const environment = process.env.APP_ENV || (process.env.CF_PAGES_BRANCH === "main" ? "production" : "preview");

	// The version the source maps were uploaded under, so Rollbar links the
	// deploy to them.
	const revision = getBuildRelease() ?? getRelease();

	const payload: DeployPayload = {
		access_token: token,
		environment,
		revision,
		date: new Date().toISOString(),
		status: "succeeded",
		comment: `Deployed ${revision} to ${environment}`,
	};

	try {
		const response = await fetch(ROLLBAR_API, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(`Failed to notify Rollbar: ${response.status} ${response.statusText}`);
		}

		// Type guard to verify response shape
		if (!data || typeof data !== "object" || !("data" in data)) {
			throw new Error(`Invalid Rollbar response format: ${JSON.stringify(data)}`);
		}

		const result = data.data;
		if (typeof result !== "object" || !result || !("deploy_id" in result)) {
			throw new Error(`Missing required fields in Rollbar response: ${JSON.stringify(data)}`);
		}
	} catch (_error) {
		// Don't throw - we don't want to fail the build for monitoring issues
	}
}
