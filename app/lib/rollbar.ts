import { ErrorBoundary, Provider as RollbarProvider } from "@rollbar/react";
import type { Configuration } from "rollbar";
import Rollbar from "rollbar";

// Common config for both client and server
const rollbarConfig: Partial<Configuration> = {
	accessToken: process.env.ROLLBAR_ACCESS_TOKEN || "",
	environment: process.env.NODE_ENV || "development",
	captureUncaught: true,
	captureUnhandledRejections: true,
	payload: {
		client: {
			javascript: {
				source_map_enabled: true,
				code_version: "0.0.1", // Update this with your version
			},
		},
	},
};

// Server-side Rollbar instance
export const serverRollbar = new Rollbar({
	...rollbarConfig,
	// Server specific options
	reportLevel: "warning",
	// Ensure accessToken is always defined for server
	accessToken: process.env.ROLLBAR_ACCESS_TOKEN || "",
});

// Client-side Rollbar configuration
export const clientRollbarConfig: Configuration = {
	...rollbarConfig,
	// Client specific options
	enabled: typeof window !== "undefined",
	// Ensure accessToken is always defined for client
	accessToken: process.env.ROLLBAR_ACCESS_TOKEN || "",
};

// Re-export components for convenience
export { RollbarProvider, ErrorBoundary };
