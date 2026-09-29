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

async function reportServerError(err: unknown, properties: CaptureProperties) {
	try {
		const serverModule = await import("@tanstack/react-start/server");
		// A handler that set a 4xx status and threw a plain Error (e.g.
		// requireAuthedUser's 401) is expected too.
		const status = serverModule.getResponseStatus();
		if (status >= 400 && status < 500) return;

		const sessionModule = await import("~/server/auth/session");
		const user = await sessionModule.getOptionalSessionUser().catch(() => null);

		const posthogModule = await import("./posthog");
		posthogModule.captureServerException(err, {
			distinctId: user?.id,
			properties,
		});
	} catch {
		// Reporting must never change the error the caller sees
	}
}
