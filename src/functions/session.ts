import { createServerFn } from "@tanstack/react-start";

/**
 * Returns the currently authenticated user, or null if anonymous.
 *
 * Anonymous and authed paths are both handled inside
 * `~/server/auth/session#getOptionalSessionUser`, which also forwards
 * any Set-Cookie headers from session refresh. The helper does the
 * `getRequest()` v1.134+ defensive try/catch in one place so this
 * file stays a thin createServerFn shell.
 */
export async function handleGetSessionUser() {
	const { getOptionalSessionUser } = await import("~/server/auth/session");
	return getOptionalSessionUser();
}

export const getSessionUser = createServerFn({ method: "GET" }).handler(handleGetSessionUser);
