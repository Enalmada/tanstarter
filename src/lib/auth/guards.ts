/**
 * Route guards, for `beforeLoad` in the pathless layout routes (`_guest`,
 * `_authed`, `_authed/_admin`). They only decide where the visitor goes; the
 * server still enforces access on every server function (authMiddleware) and
 * API route. Client-safe: import nothing that pulls in server code.
 */

import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "~/lib/auth/session";

export const DEFAULT_REDIRECT = "/tasks";

// Sending someone back to a sign-in or sign-out page would loop or sign them out.
const AUTH_PAGES = /^\/(?:signin|signup|signout)(?:[/?#]|$)/;

/**
 * Validates a `?redirect=` value. Only same-origin paths are accepted; anything
 * else (absolute or protocol-relative URLs, backslashes, control characters,
 * the auth pages themselves) falls back to `fallback`.
 */
export function safeRedirect(value: unknown, fallback: string = DEFAULT_REDIRECT): string {
	if (typeof value !== "string") return fallback;
	if (!value.startsWith("/") || value.startsWith("//")) return fallback;
	// biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
	if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
	if (AUTH_PAGES.test(value)) return fallback;
	return value;
}

/** Signed-in visitors have no business on the sign-in and sign-up pages. */
export async function redirectIfSignedIn(queryClient: QueryClient, redirectTo: unknown) {
	const user = await queryClient.query(sessionQueryOptions());
	if (user) {
		throw redirect({ href: safeRedirect(redirectTo) });
	}
}
