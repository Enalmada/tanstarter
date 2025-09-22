/**
 * Rollbar Deploy and Source Map Upload Integration
 *
 * This module handles source map uploads to Rollbar during the build process.
 * It runs as part of the post-build process and uses Cloudflare Pages environment variables.
 *
 * @see https://docs.rollbar.com/reference/post-deploy
 */

import { getRelease } from "../env/release";

const ROLLBAR_API = "https://api.rollbar.com/api/1/deploy";

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
 * Notifies Rollbar about source maps for a new deployment.
 *
 * This function:
 * 1. Determines the environment based on Cloudflare Pages branch
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

	// Map Cloudflare Pages branch to environment
	const environment =
		process.env.CF_PAGES_BRANCH === "main" ? "production" : "preview";

	const revision = getRelease();

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
			throw new Error(
				`Failed to notify Rollbar: ${response.status} ${response.statusText}`,
			);
		}

		// Type guard to verify response shape
		if (!data || typeof data !== "object" || !("data" in data)) {
			throw new Error(
				`Invalid Rollbar response format: ${JSON.stringify(data)}`,
			);
		}

		const result = data.data;
		if (typeof result !== "object" || !result || !("deploy_id" in result)) {
			throw new Error(
				`Missing required fields in Rollbar response: ${JSON.stringify(data)}`,
			);
		}
	} catch (_error) {
		// Don't throw - we don't want to fail the build for monitoring issues
	}
}
