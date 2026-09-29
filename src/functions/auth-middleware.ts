/**
 * Function middleware that requires a signed-in user and puts it on
 * `context.user`, so handlers don't each call `requireAuthedUser` themselves.
 *
 * - `authMiddleware` reads the session through better-auth's 5-minute cookie
 *   cache. Enough for actions that don't depend on the user's current role.
 * - `freshAuthMiddleware` re-reads the user row (`freshFromDb`), so a role
 *   change takes effect on the next call. Use it for authorization decisions
 *   (CASL checks, admin gates).
 *
 * Both throw a 401 `Unauthorized` before the handler (and the handler's input
 * validator) runs. `~/server/auth/session` is imported inside `.server()`
 * because this module is reachable from client code (TSS-2).
 */

import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
	const { requireAuthedUser } = await import("~/server/auth/session");
	const user = await requireAuthedUser();
	return next({ context: { user } });
});

export const freshAuthMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
	const { requireAuthedUser } = await import("~/server/auth/session");
	const user = await requireAuthedUser({ freshFromDb: true });
	return next({ context: { user } });
});
