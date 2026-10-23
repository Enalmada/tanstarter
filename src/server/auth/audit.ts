/**
 * Audit trail for sign-in activity: one structured line per sign-up, sign-in,
 * sign-out and email verification, with the outcome and the client IP.
 *
 * The IP comes from the same `fly-client-ip` header the rate limiter uses (see
 * ./ip-address), so it is the real client and not a proxy. Lines carry the user
 * id when there is one and never the email address or password: a failed
 * attempt is identified by IP and error code. They go through the logger, so
 * they reach Axiom when it is configured. Authenticated server-function
 * mutations are not logged here.
 */

import { createAuthMiddleware, getIP, isAPIError } from "better-auth/api";

const AUDITED_PATHS = {
	"/sign-up/email": "sign_up",
	"/sign-in/email": "sign_in",
	"/sign-out": "sign_out",
	"/verify-email": "email_verified",
	// Google (and any other OAuth provider) completes sign-in here
	"/callback/:id": "sign_in_oauth",
} as const;

type AuditEvent = (typeof AUDITED_PATHS)[keyof typeof AUDITED_PATHS];

// Failed endpoints throw an APIError, but so do redirects (the verify-email and OAuth callbacks send
// the browser on with a 302), and those report a failure as `?error=` on the target instead.
function failureOf(returned: unknown): { status: number; code: string | undefined } | null {
	if (!isAPIError(returned)) {
		return null;
	}
	if (returned.statusCode >= 400) {
		return { status: returned.statusCode, code: (returned.body as { code?: string } | undefined)?.code };
	}
	const location = returned.headers instanceof Headers ? returned.headers.get("location") : null;
	const error = location ? new URL(location, "http://localhost").searchParams.get("error") : null;
	return error ? { status: returned.statusCode, code: error } : null;
}

export function createAuthAuditHook(write: (message: string, data: Record<string, unknown>) => void) {
	return createAuthMiddleware(async (ctx) => {
		const event: AuditEvent | undefined = AUDITED_PATHS[ctx.path as keyof typeof AUDITED_PATHS];
		if (!event) {
			return;
		}

		const failure = failureOf(ctx.context.returned);
		const userId = ctx.context.newSession?.user.id ?? ctx.context.session?.user.id;
		const ip = ctx.request ? getIP(ctx.request, ctx.context.options) : null;

		write("audit.auth", {
			event,
			outcome: failure ? "failure" : "success",
			...(failure ? { status: failure.status, code: failure.code } : {}),
			...(userId ? { userId } : {}),
			ip,
		});
	});
}
