/**
 * `onAPIError.onError` for better-auth: reports unexpected failures inside
 * `/api/auth/*` that better-auth turns into a 500 response itself, so neither
 * the request error reporter nor Nitro's error hook ever sees them.
 *
 * better-auth calls it from its router (auth.handler) only, with what reached
 * the router's catch: anything an endpoint throws that is not an APIError (a
 * database failure, a bug), plus APIErrors from router middleware such as the
 * origin check (403). An endpoint's own APIErrors (invalid credentials, ...)
 * become responses earlier and never get here; redirects are skipped before the
 * call. Providing the hook replaces better-auth's own error log line, so this
 * logs one in its place.
 *
 * Privacy: the log line is a fixed message plus the numeric status. No request
 * data (body, headers, email) goes to either sink; PostHog's before_send scrubs
 * the error itself (see src/lib/monitoring/sanitize.ts).
 */

import { isAPIError } from "better-auth/api";

type Log = (message: string, data: Record<string, unknown>) => void;
type Capture = (error: unknown, properties: { source: string; status: number | null }) => void | Promise<void>;

export function createAuthApiErrorHandler(log: Log, capture: Capture) {
	return async (error: unknown) => {
		const status = isAPIError(error) ? error.statusCode : null;
		if (status !== null && status < 500) return;

		// Each sink is best-effort: a telemetry failure must not change the auth response.
		try {
			log("Better Auth API failure", { status });
		} catch {
			// ignored
		}
		try {
			await capture(error instanceof Error ? error : new Error("Better Auth API failure"), {
				source: "better-auth",
				status,
			});
		} catch {
			// ignored
		}
	};
}
