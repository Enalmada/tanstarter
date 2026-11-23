/**
 * Server-only helpers for loading the authenticated user from the
 * current request's session cookie. Two flavors:
 *
 *   - `getOptionalSessionUser()` — returns the user or `null`. Use when
 *     the anonymous path is valid (e.g. session probes for marketing
 *     pages, public-route loaders).
 *   - `requireAuthedUser()` — returns the user or throws
 *     `UnauthenticatedError` (401). Use in createServerFn handlers that
 *     already require a session.
 *
 * Both:
 *   - Honor the Playwright test-token shortcut (seeded users, dev server
 *     started by Playwright only) via `~/utils/test/playwright`.
 *   - Resolve the per-request `Request` via `getSessionRequest()` —
 *     handles the `getRequest()` v1.134+ throw-on-missing-context
 *     in ONE place.
 *   - Call `auth.api.getSession()` without `asResponse`. better-auth's
 *     `tanstackStartCookies()` plugin (registered in `./auth`) applies any
 *     `Set-Cookie` from session refresh or expiry to Start's response
 *     through `setCookie`, which merges with cookies set elsewhere in the
 *     request. Forwarding them again by hand with `setResponseHeader`
 *     would replace those other cookies, and `.json()` on a Response
 *     would turn the user's Dates into strings.
 *   - Accept `{ freshFromDb: true }` to bypass better-auth's cookie
 *     cache and re-query the DB. Use for authed actions that need to
 *     observe a role/permission change written earlier in the same
 *     session.
 *
 * This module is server-only and is dynamic-imported by handlers — it
 * MUST NOT be imported at the top level of any file reachable from a
 * client route (v1.167+ import-protection plugin).
 */

import "@tanstack/react-start/server-only";
import type { SessionUser } from "~/server/auth/auth";

// All cross-module calls below go through the IMPORTED MODULE NAMESPACE, not
// through destructured local bindings. This matters for unit tests:
// `vi.spyOn(module, "fn")` replaces the property on the module object, but a
// destructured `const { fn } = await import(...)` captured the ORIGINAL
// reference and won't see the spy. Calling `mod.fn()` keeps the indirection
// so tests can intercept at the helper layer.

export async function getOptionalSessionUser(opts?: { freshFromDb?: boolean }): Promise<SessionUser | null> {
	const playwrightModule = await import("~/utils/test/playwright");
	const mockUser = await playwrightModule.checkPlaywrightTestAuth();
	if (mockUser) return mockUser;

	const requestModule = await import("./request");
	const request = await requestModule.getSessionRequest();
	if (!request) return null;

	const authModule = await import("./auth");
	// No `asResponse`: tanstackStartCookies() (see ./auth) already applies any
	// Set-Cookie from this call to Start's response, merged with the other cookies.
	const session = await authModule.auth.api.getSession({
		headers: request.headers,
		...(opts?.freshFromDb ? { query: { disableCookieCache: true } } : {}),
	});

	// Cast: the inferred role is `string`; SessionUser narrows it to UserRole.
	return (session?.user as SessionUser | undefined) ?? null;
}

export async function requireAuthedUser(opts?: { freshFromDb?: boolean }): Promise<SessionUser> {
	const user = await getOptionalSessionUser(opts);
	if (!user) {
		// authErrorTranslator sets the 401 and sends only the safe message.
		const { UnauthenticatedError } = await import("~/server/access/http-errors");
		throw new UnauthenticatedError();
	}
	return user;
}
