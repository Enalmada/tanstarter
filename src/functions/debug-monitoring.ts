/**
 * Server functions for /debug/monitoring: exercise server-side error tracking.
 *
 * Admin-only, so the debug page can't be used to spend the PostHog exception
 * quota. `throwUnexpectedServerError` should become a PostHog issue carrying the
 * admin's user id; `throwExpectedServerError` (a 404 domain error) should not.
 */

import { createServerFn } from "@tanstack/react-start";
import { freshAuthMiddleware } from "~/functions/auth-middleware";
import { NotAuthorizedError, NotFoundError } from "~/server/access/http-errors";
import type { SessionUser } from "~/server/auth/auth";

function requireAdmin(user: SessionUser) {
	if (user.role !== "ADMIN") {
		throw new NotAuthorizedError("debug monitoring requires ADMIN");
	}
}

export const throwUnexpectedServerError = createServerFn({ method: "POST" })
	.middleware([freshAuthMiddleware])
	.handler(async ({ context }) => {
		requireAdmin(context.user);
		throw new Error("Test unexpected server error from /debug/monitoring");
	});

export const throwExpectedServerError = createServerFn({ method: "POST" })
	.middleware([freshAuthMiddleware])
	.handler(async ({ context }) => {
		requireAdmin(context.user);
		throw new NotFoundError("Test expected server error from /debug/monitoring");
	});
