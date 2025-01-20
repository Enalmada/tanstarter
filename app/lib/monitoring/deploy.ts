/**
 * Rollbar Deploy Tracking Integration
 *
 * This module handles notifying Rollbar about deployments to help correlate errors with specific releases.
 * It runs as part of the post-build process and uses Cloudflare Pages environment variables to determine
 * the deployment environment and details.
 *
 * @see https://docs.rollbar.com/reference/post-deploy
 */

import { getRelease } from "../env/release";
import { monitor } from "./index";

const ROLLBAR_API = "https://api.rollbar.com/api/1/deploy";

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

// Type definition for Rollbar's deploy API response
interface RollbarDeployResponse {
	err: number;
	result: {
		deploy_id: number;
		environment: string;
	};
}

/**
 * Notifies Rollbar about a new deployment.
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
	const token = process.env.ROLLBAR_SERVER_TOKEN;
	if (!token) {
		monitor.warn("Missing ROLLBAR_SERVER_TOKEN - skipping deploy notification");
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
		local_username: process.env.CF_PAGES_BRANCH,
		comment: `Deploy of ${revision} to ${environment} via Cloudflare Pages`,
		status: "succeeded", // Since this runs after successful build
		date: new Date().toISOString(),
		// rollbar_username can be added if you have a Rollbar user context
	};

	try {
		const response = await fetch(ROLLBAR_API, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`Failed to notify Rollbar: ${response.statusText}`);
		}

		// Log successful deploy with Rollbar's deploy ID for reference
		const data = (await response.json()) as RollbarDeployResponse;
		monitor.info(
			`Notified Rollbar of deployment: ${revision} to ${environment}`,
			{ deployId: data.result.deploy_id },
		);
	} catch (error) {
		monitor.error("Failed to notify Rollbar of deployment:", error);
		// Don't fail the build for this
	}
}
