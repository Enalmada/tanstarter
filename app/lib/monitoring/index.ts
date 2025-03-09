import type { Configuration } from "rollbar";
import { env } from "~/env";
import { getAppEnv, shouldReportErrors } from "../env/environment";
import { getRelease } from "../env/release";
import { RollbarMonitor, createRollbarConfig } from "./rollbar";
import type { ErrorMonitor, MonitorUser, MonitoringConfig } from "./types";

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
export const monitor: ErrorMonitor = (() => {
	// Only create the RollbarMonitor instance on the server
	if (!isServer) {
		// Return a no-op monitor for the client
		return {
			error: () => {},
			warn: () => {},
			info: () => {},
			debug: () => {},
			setUser: () => {},
			breadcrumb: () => {},
		};
	}

	let instance: ErrorMonitor | null = null; // Keep the instance nullable

	return {
		error: (message: string | Error, extra?: unknown) => {
			if (!instance) instance = new RollbarMonitor(baseConfig);
			instance.error(message, extra);
		},
		warn: (message: string | Error, extra?: unknown) => {
			if (!instance) instance = new RollbarMonitor(baseConfig);
			instance.warn(message, extra);
		},
		info: (message: string | Error, extra?: unknown) => {
			if (!instance) instance = new RollbarMonitor(baseConfig);
			instance.info(message, extra);
		},
		debug: (message: string | Error, extra?: unknown) => {
			if (!instance) instance = new RollbarMonitor(baseConfig);
			instance.debug(message, extra);
		},
		setUser: (user: MonitorUser | null) => {
			if (!instance) instance = new RollbarMonitor(baseConfig);
			instance.setUser(user);
		},
		breadcrumb: (message: string, metadata?: Record<string, unknown>) => {
			if (!instance) instance = new RollbarMonitor(baseConfig);
			instance.breadcrumb(message, metadata);
		},
	};
})();

// Client-side config
export const clientConfig = createRollbarConfig({
	...baseConfig,
	enabled: !isServer && hasToken,
	// Let hooks handle errors on the client side
	captureUncaught: false,
	captureUnhandledRejections: false,
});
