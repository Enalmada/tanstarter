import { Provider, ErrorBoundary as RollbarBoundary } from "@rollbar/react";
import type { Configuration, LogArgument } from "rollbar";
import Rollbar from "rollbar";
import type { ErrorMonitor, MonitorUser, MonitoringConfig } from "./types";

export class RollbarMonitor implements ErrorMonitor {
	private rollbar: Rollbar | null;
	private enabled: boolean;

	constructor(config: MonitoringConfig) {
		this.enabled = config.enabled;

		if (this.enabled) {
			const rollbarConfig = {
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
			};

			this.rollbar = new Rollbar(rollbarConfig);
		} else {
			console.debug("Rollbar disabled - using console fallback");
			this.rollbar = null;
		}
	}

	error(message: string | Error, extra?: unknown) {
		if (this.rollbar) {
			console.debug("Sending error to Rollbar:", { message, extra });
			this.rollbar.error(message, extra as LogArgument);
		} else {
			console.error(message, extra);
		}
	}

	warn(message: string | Error, extra?: unknown) {
		if (this.rollbar) {
			console.debug("Sending warning to Rollbar:", { message, extra });
			this.rollbar.warning(message, extra as LogArgument);
		} else {
			console.warn(message, extra);
		}
	}

	info(message: string | Error, extra?: unknown) {
		if (this.rollbar) {
			this.rollbar.info(message, extra as LogArgument);
		} else {
			console.info(message, extra);
		}
	}

	debug(message: string | Error, extra?: unknown) {
		if (this.rollbar) {
			this.rollbar.debug(message, extra as LogArgument);
		} else {
			console.debug(message, extra);
		}
	}

	setUser(user: MonitorUser | null) {
		if (!this.rollbar) return;

		if (user) {
			// console.info("Setting Rollbar user:", user);
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
		if (this.rollbar) {
			this.info(message, metadata as LogArgument);
		} else {
			console.info("Breadcrumb:", message, metadata);
		}
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
