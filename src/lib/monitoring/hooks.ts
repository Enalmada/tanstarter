import { useRollbar } from "@rollbar/react";
import type { LogArgument } from "rollbar";
import type { ErrorMonitor, MonitorUser } from "./types";

const noopMonitor: ErrorMonitor = {
	error: () => {},
	warn: () => {},
	info: () => {},
	debug: () => {},
	setUser: () => {},
	breadcrumb: () => {},
};

/**
 * Hook to access the error monitor instance
 * Provides a consistent interface regardless of monitoring provider
 */
export function useMonitor(): ErrorMonitor {
	const rollbar = useRollbar();

	try {
		// If Rollbar isn't initialized, return a no-op monitor
		if (!rollbar) return noopMonitor;

		return {
			error: (message: string | Error, extra?: unknown) =>
				rollbar.error(message, extra as LogArgument),
			warn: (message: string | Error, extra?: unknown) =>
				rollbar.warning(message, extra as LogArgument),
			info: (message: string | Error, extra?: unknown) =>
				rollbar.info(message, extra as LogArgument),
			debug: (message: string | Error, extra?: unknown) =>
				rollbar.debug(message, extra as LogArgument),
			setUser: (user: MonitorUser | null) =>
				user
					? rollbar.configure({
							payload: {
								person: {
									id: user.id,
									// biome-ignore lint/style/noNonNullAssertion: user.email is guaranteed to exist from auth
									username: user.name || user.email!,
									// biome-ignore lint/style/noNonNullAssertion: user.email is guaranteed to exist from auth
									email: user.email!,
								},
							},
						})
					: undefined,
			breadcrumb: (message: string, metadata?: Record<string, unknown>) =>
				rollbar.info(message, metadata as LogArgument),
		};
	} catch (_error) {
		// If there's any error accessing Rollbar, return a no-op monitor
		return noopMonitor;
	}
}
