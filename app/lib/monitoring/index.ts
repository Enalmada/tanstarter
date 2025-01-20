import { clientEnv } from "~/lib/env-client";
import { RollbarMonitor, createRollbarConfig } from "./rollbar";
import type { ErrorMonitor } from "./types";

const isServer = typeof window === "undefined";
const hasToken = Boolean(clientEnv.PUBLIC_ROLLBAR_ACCESS_TOKEN);

const monitoringConfig = {
	accessToken: clientEnv.PUBLIC_ROLLBAR_ACCESS_TOKEN || "",
	environment: clientEnv.NODE_ENV || "development",
	enabled: hasToken,
	release: "1.0.0", // TODO: Get this from package.json or build process
};

// Server-side monitor instance
export const monitor: ErrorMonitor = new RollbarMonitor({
	...monitoringConfig,
	// Server monitoring only works server-side
	enabled: isServer && hasToken,
});

// Client-side config
export const clientConfig = createRollbarConfig({
	...monitoringConfig,
	// Client monitoring only works client-side
	enabled: !isServer && hasToken,
});

export { ErrorBoundary, MonitoringProvider } from "./rollbar";
export { useMonitor } from "./hooks";
export type { ErrorBoundaryProps, ErrorMonitor, MonitorUser } from "./types";
