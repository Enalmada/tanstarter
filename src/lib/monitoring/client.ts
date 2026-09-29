/**
 * Browser PostHog: one init for analytics and error tracking, plus the
 * client `ErrorMonitor`.
 *
 * Loaded with a dynamic import (src/client.tsx, report.ts, analytics.tsx) so
 * posthog-js stays out of the main chunk. `initPosthog()` is idempotent.
 */

import posthog from "posthog-js";
import { env, getAppEnv, shouldReportErrors } from "~/env";
import { type CaptureProperties, POSTHOG_HOST, toCapture } from "./capture";
import { isExpectedError } from "./expected-errors";
import { sanitizeExceptionEvent } from "./sanitize";
import type { ErrorMonitor, MonitorUser } from "./types";

export function initPosthog(): boolean {
	if (typeof window === "undefined" || !env.PUBLIC_POSTHOG_API_KEY) return false;
	if (posthog.__loaded) return true;

	posthog.init(env.PUBLIC_POSTHOG_API_KEY, {
		api_host: POSTHOG_HOST,
		person_profiles: "identified_only",
		loaded: (instance) => {
			if (window.location.hostname === "localhost") {
				instance.debug();
			}
		},
		// Uncaught errors and unhandled rejections. Not in development: those
		// would land in the same project as real issues.
		capture_exceptions: shouldReportErrors(),
		// Strips URLs' query strings and Drizzle bound params from exception
		// events, and drops automatically captured expected errors
		before_send: (event) => sanitizeExceptionEvent(event),
		// Disable features in development
		disable_session_recording: process.env.NODE_ENV !== "production",
		enable_heatmaps: process.env.NODE_ENV === "production",
		capture_performance: process.env.NODE_ENV === "production",
	});
	posthog.register({ app_env: getAppEnv() });
	return true;
}

/** Report a caught error. Expected errors (redirects, 4xx) are skipped. */
export function captureClientError(error: unknown, properties?: CaptureProperties) {
	if (isExpectedError(error) || !shouldReportErrors() || !initPosthog()) return;
	posthog.captureException(error, properties);
}

export const clientMonitor: ErrorMonitor = {
	error: (message, extra) => {
		const { error, properties } = toCapture(message, extra);
		captureClientError(error, properties);
	},
	warn: (message, extra) => {
		const { error, properties } = toCapture(message, extra);
		captureClientError(error, { ...properties, $exception_level: "warning" });
	},
	// info/debug/breadcrumb become exception steps: context attached to the
	// next captured exception, not issues of their own.
	info: (message, extra) => addStep(message, extra),
	debug: (message, extra) => addStep(message, extra),
	breadcrumb: (message, metadata) => addStep(message, metadata),
	// Analytics identifies the signed-in user (utils/analytics.tsx), and sign-out
	// resets PostHog, so this only covers a user set outside that flow.
	setUser: (user: MonitorUser | null) => {
		if (!user || !initPosthog() || posthog.get_distinct_id() === user.id) return;
		posthog.identify(user.id);
	},
};

function addStep(message: string | Error, extra?: unknown) {
	if (!initPosthog()) return;
	const { properties } = toCapture(message, extra);
	posthog.addExceptionStep(message instanceof Error ? message.message : message, properties);
}
