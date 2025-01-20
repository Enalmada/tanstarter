import type { Configuration } from "rollbar";
import { env } from "~/env";
import { getAppEnv, shouldReportErrors } from "../env/environment";
import { getRelease } from "../env/release";
import { RollbarMonitor, createRollbarConfig } from "./rollbar";
import type { ErrorMonitor, MonitoringConfig } from "./types";

const isServer = typeof window === "undefined";
const hasToken = Boolean(env.PUBLIC_ROLLBAR_ACCESS_TOKEN);

// Base monitoring configuration that matches our local type
const baseConfig: MonitoringConfig = {
	enabled: hasToken && shouldReportErrors(),
	environment: getAppEnv(),
	release: getRelease(),
	accessToken: env.PUBLIC_ROLLBAR_ACCESS_TOKEN || "",
};

// Full Rollbar configuration with additional options
export const monitoringConfig: Configuration = {
	...baseConfig,
	// Only capture uncaught errors on the server side
	captureUncaught: isServer,
	captureUnhandledRejections: isServer,
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
	// Let hooks handle errors on the client side
	captureUncaught: false,
	captureUnhandledRejections: false,
});

export { ErrorBoundary, MonitoringProvider } from "./rollbar";
export { useMonitor } from "./hooks";
export type { ErrorBoundaryProps, ErrorMonitor, MonitorUser } from "./types";
