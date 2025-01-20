import type { Configuration } from "rollbar";
import { clientEnv } from "../env-client";
import { getAppEnv, shouldReportErrors } from "../env/environment";
import { RollbarMonitor, createRollbarConfig } from "./rollbar";
import type { ErrorMonitor, MonitoringConfig } from "./types";

const isServer = typeof window === "undefined";
const hasToken = Boolean(clientEnv.PUBLIC_ROLLBAR_ACCESS_TOKEN);

// Get release info from Cloudflare Pages or default to environment
const getRelease = () => {
	const release = clientEnv.CF_PAGES_COMMIT_SHA
		? `${clientEnv.CF_PAGES_BRANCH}@${clientEnv.CF_PAGES_COMMIT_SHA}`
		: getAppEnv();

	// Ensure release is always defined for type safety
	return release;
};

// Base monitoring configuration that matches our local type
const baseConfig: MonitoringConfig = {
	enabled: hasToken && shouldReportErrors(),
	environment: getAppEnv(),
	release: getRelease(),
	accessToken: clientEnv.PUBLIC_ROLLBAR_ACCESS_TOKEN || "",
};

// Full Rollbar configuration with additional options
export const monitoringConfig: Configuration = {
	...baseConfig,
	captureUncaught: true,
	captureUnhandledRejections: true,
	payload: {
		client: {
			javascript: {
				source_map_enabled: true,
				code_version: getRelease(),
				guess_uncaught_frames: true,
			},
		},
	},
};

// Server-side monitor instance
export const monitor: ErrorMonitor = new RollbarMonitor(baseConfig);

// Client-side config
export const clientConfig = createRollbarConfig({
	...baseConfig,
	enabled: !isServer && hasToken,
});

export { ErrorBoundary, MonitoringProvider } from "./rollbar";
export { useMonitor } from "./hooks";
export type { ErrorBoundaryProps, ErrorMonitor, MonitorUser } from "./types";
