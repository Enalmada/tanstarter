/**
 * Server functions for /debug/monitoring: exercise server-side error tracking.
 *
 * Admin-only, so the debug page can't be used to spend the PostHog exception
 * quota. `throwUnexpectedServerError` should become a PostHog issue carrying the
 * admin's user id; `throwExpectedServerError` (a 404 domain error) should not.
 */

import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { NotAuthorizedError, NotFoundError } from "~/server/access/http-errors";

const requireAdmin = createServerOnlyFn(async () => {
	const { requireAuthedUser } = await import("~/server/auth/session");
	const user = await requireAuthedUser();
	if (user.role !== "ADMIN") {
		throw new NotAuthorizedError("debug monitoring requires ADMIN");
	}
});

export const throwUnexpectedServerError = createServerFn({ method: "POST" }).handler(async () => {
	await requireAdmin();
	throw new Error("Test unexpected server error from /debug/monitoring");
});

export const throwExpectedServerError = createServerFn({ method: "POST" }).handler(async () => {
	await requireAdmin();
	throw new NotFoundError("Test expected server error from /debug/monitoring");
});
