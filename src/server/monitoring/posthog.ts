/**
 * Server PostHog client (posthog-node) for error tracking.
 *
 * Server-only: import it dynamically from anything reachable from a client
 * route (TSS-2). Callers: the Nitro plugin (src/server/monitoring/nitro-plugin.ts)
 * and the server-function middleware (src/server/monitoring/middleware.ts).
 *
 * The client and the "already captured" set live on globalThis because the
 * Nitro plugin and the SSR bundle can each get their own copy of this module.
 */

import { PostHog } from "posthog-node";
import { env, getAppEnv, shouldReportErrors } from "~/env";
import { getRelease } from "~/lib/env/release";
import { type CaptureProperties, POSTHOG_HOST } from "~/lib/monitoring/capture";
import { isExpectedError } from "~/lib/monitoring/expected-errors";
import { sanitizeExceptionEvent } from "~/lib/monitoring/sanitize";

interface ServerPosthogState {
	client: PostHog | null;
	captured: WeakSet<object>;
}

const STATE_KEY = "__tanstarterServerPosthog";
type GlobalWithState = typeof globalThis & { [STATE_KEY]?: ServerPosthogState };

function getState(): ServerPosthogState {
	const g = globalThis as GlobalWithState;
	if (!g[STATE_KEY]) {
		// The project API key is public (the browser uses the same one). Read from
		// the runtime env: the Docker build has no key, it arrives as a Fly secret,
		// so a build-time `process.env` replacement would be empty.
		const key = env.PUBLIC_POSTHOG_API_KEY;
		g[STATE_KEY] = {
			client:
				key && shouldReportErrors()
					? new PostHog(key, {
							host: POSTHOG_HOST,
							// Exceptions are rare: send each one right away instead of batching.
							flushAt: 1,
							flushInterval: 0,
							// Drizzle "Failed query" messages carry bound row values
							before_send: (event) => sanitizeExceptionEvent(event),
						})
					: null,
			captured: new WeakSet(),
		};
	}
	return g[STATE_KEY];
}

export interface ServerCaptureOptions {
	distinctId?: string | undefined;
	properties?: CaptureProperties;
}

/**
 * Capture an unexpected server error once. Expected errors (redirects, 4xx)
 * are skipped, and an error object already captured by another layer (e.g.
 * the server-function middleware, then Nitro's error hook) is not sent twice.
 *
 * Privacy: callers pass metadata only (source, path, server function name),
 * never request payloads.
 */
export function captureServerException(error: unknown, options: ServerCaptureOptions = {}) {
	if (isExpectedError(error)) return;
	const state = getState();
	if (!state.client) return;
	if (typeof error === "object" && error !== null) {
		if (state.captured.has(error)) return;
		state.captured.add(error);
	}
	state.client.captureException(error, options.distinctId, {
		app_env: getAppEnv(),
		app_release: getRelease(),
		...options.properties,
	});
}

/**
 * Flush pending events. Called from Nitro's `close` hook (SIGTERM/SIGINT).
 * Capped at 3s: Fly's default kill_timeout is 5s, and the hook runs after the
 * server has finished closing.
 */
export async function shutdownServerPosthog() {
	await (globalThis as GlobalWithState)[STATE_KEY]?.client?.shutdown(3000);
}
