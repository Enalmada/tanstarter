/**
 * Route guards, for `beforeLoad` in the pathless layout routes (`_guest`,
 * `_authed`, `_authed/_admin`). They only decide where the visitor goes; the
 * server still enforces access on every server function (authMiddleware) and
 * API route. Client-safe: import nothing that pulls in server code.
 */

import type { QueryClient } from "@tanstack/react-query";
import { type ParsedLocation, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "~/lib/auth/session";
import { UserRole } from "~/lib/enums/user-role";

export const DEFAULT_REDIRECT = "/tasks";

// Sending someone back to a sign-in or sign-out page would loop or sign them out.
const AUTH_PAGES = /^\/(?:signin|signup|signout)(?:\/|$)/;

// The path the router would match: dot segments resolved (URL parsing), percent
// escapes decoded (repeatedly, so %2573 cannot hide an "s"), case folded.
// null when it cannot be decoded, which callers treat as unsafe.
function canonicalPathname(value: string): string | null {
	try {
		let pathname = new URL(value, "http://localhost").pathname;
		for (let i = 0; i < 4; i++) {
			const decoded = decodeURIComponent(pathname);
			if (decoded === pathname) return new URL(decoded, "http://localhost").pathname.toLowerCase();
			pathname = new URL(decoded, "http://localhost").pathname;
		}
		return null;
	} catch {
		return null;
	}
}

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
	const pathname = canonicalPathname(value);
	if (pathname === null || AUTH_PAGES.test(pathname)) return fallback;
	return value;
}

/** Signed-in visitors have no business on the sign-in and sign-up pages. */
export async function redirectIfSignedIn(queryClient: QueryClient, redirectTo: unknown) {
	const user = await queryClient.query(sessionQueryOptions());
	if (user) {
		throw redirect({ href: safeRedirect(redirectTo) });
	}
}

/** Signed-out visitors go to the sign-in page, which sends them back afterwards. */
export async function requireUser(queryClient: QueryClient, location: Pick<ParsedLocation, "href">) {
	const user = await queryClient.query(sessionQueryOptions());
	if (!user) {
		throw redirect({ to: "/signin", search: { redirect: location.href } });
	}
	return user;
}

/** Signed-in members who open an admin page land on the task list with a notice. */
export function requireAdmin(user: { role?: string | null | undefined }) {
	if (user.role !== UserRole.ADMIN) {
		throw redirect({ to: "/tasks", search: { error: "Access denied. Admin privileges required." } });
	}
}
