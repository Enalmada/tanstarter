/**
 * Global middleware that reports unexpected server errors to PostHog with the
 * signed-in user's id, then rethrows unchanged. Registered in src/start.ts.
 *
 * - `errorReporter` (function middleware): server-function errors are
 *   serialized into the response, so they never reach Nitro's error hook. It
 *   sits after authErrorTranslator, so it sees the original domain error
 *   rather than the sanitized wire error.
 * - `requestErrorReporter` (request middleware): errors thrown by server
 *   routes (`/api/*`, `/health`, ...). TanStack Start logs and answers those
 *   itself, so Nitro's error hook (src/server/monitoring/nitro-plugin.ts,
 *   which covers everything else) never sees them.
 *
 * Reachable from start.ts (and so from the client bundle): everything
 * server-only is dynamic-imported inside `.server()` (TSS-2).
 */

import { createMiddleware } from "@tanstack/react-start";
import type { CaptureProperties } from "~/lib/monitoring/capture";
import { isExpectedError } from "~/lib/monitoring/expected-errors";
import { requestPath } from "~/lib/monitoring/request-path";

const SESSION_LOOKUP_TIMEOUT_MS = 1000;

export const errorReporter = createMiddleware({ type: "function" }).server(async ({ next, serverFnMeta }) => {
	try {
		return await next();
	} catch (err) {
		if (!isExpectedError(err)) {
			await reportServerError(err, { source: "serverFn", server_fn: serverFnMeta.name });
		}
		throw err;
	}
});

export const requestErrorReporter = createMiddleware({ type: "request" }).server(
	async ({ next, request, handlerType }) => {
		try {
			return await next();
		} catch (err) {
			// Server-function errors are reported by errorReporter
			if (handlerType !== "serverFn" && !isExpectedError(err)) {
				// Path only: query strings can carry tokens or personal data.
				await reportServerError(err, { source: "serverRoute", path: requestPath(request.url) });
			}
			throw err;
		}
	},
);

// No response-status check here: the status is shared by the whole request, so
// an earlier 4xx would hide a later unexpected error. Expected errors are typed
// instead (isExpectedError), including requireAuthedUser's UnauthenticatedError.
async function reportServerError(err: unknown, properties: CaptureProperties) {
	try {
		// Nothing to report to: skip the session lookup, a second database round trip on the failure path.
		const { env, shouldReportErrors } = await import("~/env");
		if (!env.PUBLIC_POSTHOG_API_KEY || !shouldReportErrors()) return;

		const sessionModule = await import("~/server/auth/session");
		const user = await lookupUserWithin(() => sessionModule.getOptionalSessionUser(), SESSION_LOOKUP_TIMEOUT_MS);

		const posthogModule = await import("./posthog");
		posthogModule.captureServerException(err, {
			distinctId: user?.id,
			properties,
		});
	} catch {
		// Reporting must never change the error the caller sees
	}
}

// Bounded: during a database outage the original error is usually the session
// lookup failing, and the caller must not wait out a connection timeout again
// just to attach a user id. The lookup itself keeps running; only the wait ends.
async function lookupUserWithin(lookup: () => Promise<{ id: string } | null>, ms: number) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<null>((resolve) => {
		timer = setTimeout(() => resolve(null), ms);
	});
	try {
		return await Promise.race([lookup().catch(() => null), deadline]);
	} finally {
		clearTimeout(timer);
	}
}
