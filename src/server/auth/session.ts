/**
 * Server-only helpers for loading the authenticated user from the
 * current request's session cookie. Two flavors:
 *
 *   - `getOptionalSessionUser()` — returns the user or `null`. Use when
 *     the anonymous path is valid (e.g. session probes for marketing
 *     pages, public-route loaders).
 *   - `requireAuthedUser()` — returns the user or throws `401
 *     Unauthorized`. Use in createServerFn handlers that already
 *     require a session.
 *
 * Both:
 *   - Honor the Playwright test-auth header shortcut via
 *     `~/utils/test/playwright`.
 *   - Resolve the per-request `Request` via `getSessionRequest()` —
 *     handles the `getRequest()` v1.134+ throw-on-missing-context
 *     in ONE place.
 *   - Call `auth.api.getSession({ asResponse: true })` and forward any
 *     `Set-Cookie` headers from session refresh — so authed handlers
 *     get cookie rotation for free, matching what `session.ts` used to
 *     do inline.
 *   - Accept `{ freshFromDb: true }` to bypass better-auth's cookie
 *     cache and re-query the DB. Use for authed actions that need to
 *     observe a role/permission change written earlier in the same
 *     session.
 *
 * This module is server-only and is dynamic-imported by handlers — it
 * MUST NOT be imported at the top level of any file reachable from a
 * client route (v1.167+ import-protection plugin).
 */

import type { SessionUser } from "~/server/auth/auth";

export async function getOptionalSessionUser(opts?: { freshFromDb?: boolean }): Promise<SessionUser | null> {
	const { checkPlaywrightTestAuth } = await import("~/utils/test/playwright");
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) return mockUser;

	const { getSessionRequest } = await import("./request");
	const request = await getSessionRequest();
	if (!request) return null;

	const { auth } = await import("./auth");
	const session = await auth.api.getSession({
		headers: request.headers,
		asResponse: true,
		...(opts?.freshFromDb ? { query: { disableCookieCache: true } } : {}),
	});

	// Forward any Set-Cookie headers (session refresh, expiry rotation).
	const cookies = session.headers?.getSetCookie();
	if (cookies?.length) {
		const { setResponseHeader } = await import("@tanstack/react-start/server");
		setResponseHeader("Set-Cookie", cookies);
	}

	const data = await session.json();
	return (data?.user as SessionUser) ?? null;
}

export async function requireAuthedUser(opts?: { freshFromDb?: boolean }): Promise<SessionUser> {
	const user = await getOptionalSessionUser(opts);
	if (!user) {
		const { setResponseStatus } = await import("@tanstack/react-start/server");
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}
	return user;
}
