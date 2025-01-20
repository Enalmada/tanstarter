import { Provider, ErrorBoundary as RollbarBoundary } from "@rollbar/react";
import type { Configuration, LogArgument } from "rollbar";
import Rollbar from "rollbar";
import type { ErrorMonitor, MonitorUser, MonitoringConfig } from "./types";

export class RollbarMonitor implements ErrorMonitor {
	private rollbar: Rollbar;

	constructor(config: MonitoringConfig) {
		this.rollbar = new Rollbar({
			accessToken: config.accessToken,
			environment: config.environment,
			enabled: config.enabled,
			captureUncaught: true,
			captureUnhandledRejections: true,
			autoInstrument: true,
			payload: {
				client: {
					javascript: {
						source_map_enabled: true,
						code_version: config.release || "1.0.0",
						guess_uncaught_frames: true,
					},
				},
				environment: config.environment,
			},
		});
	}

	error(message: string | Error, extra?: unknown) {
		if (!this.rollbar) return;
		this.rollbar.error(message, extra as LogArgument);
	}

	warn(message: string | Error, extra?: unknown) {
		if (!this.rollbar) return;
		this.rollbar.warning(message, extra as LogArgument);
	}

	info(message: string | Error, extra?: unknown) {
		if (!this.rollbar) return;
		this.rollbar.info(message, extra as LogArgument);
	}

	debug(message: string | Error, extra?: unknown) {
		if (!this.rollbar) return;
		this.rollbar.debug(message, extra as LogArgument);
	}

	setUser(user: MonitorUser | null) {
		if (user) {
			this.rollbar.configure({
				payload: {
					person: {
						id: user.id,
						username: user.name || user.email || "unknown",
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						email: user.email!,
					},
				},
			});
		}
	}

	breadcrumb(message: string, metadata?: Record<string, unknown>) {
		this.info(message, metadata as LogArgument);
	}

	get instance() {
		return this.rollbar;
	}
}

export function createRollbarConfig(config: MonitoringConfig): Configuration {
	return {
		accessToken: config.accessToken,
		environment: config.environment,
		enabled: config.enabled,
		captureUncaught: true,
		captureUnhandledRejections: true,
		autoInstrument: true,
		verbose: true,
		payload: {
			client: {
				javascript: {
					source_map_enabled: true,
					code_version: config.release || "1.0.0",
					guess_uncaught_frames: true,
				},
			},
			environment: config.environment,
		},
	};
}

// Create a proper wrapper component for ErrorBoundary
interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
	const FallbackComponent = () => (fallback ? <>{fallback}</> : null);

	return (
		<RollbarBoundary fallbackUI={FallbackComponent}>{children}</RollbarBoundary>
	);
}

export { Provider as MonitoringProvider };
