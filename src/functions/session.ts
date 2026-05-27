import { createServerFn } from "@tanstack/react-start";

/**
 * Returns the currently authenticated user, or null if anonymous.
 *
 * All server-only imports (`@tanstack/react-start/server`, auth, playwright
 * helpers) are dynamic-imported inside the handler. Top-level imports from
 * those modules would pull better-auth + Drizzle into the client bundle
 * via the createServerFn extraction (TSS-2 rule).
 */
export async function handleGetSessionUser() {
	const { checkPlaywrightTestAuth } = await import("~/utils/test/playwright");
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) {
		return mockUser;
	}

	const { getRequest, setResponseHeader } = await import("@tanstack/react-start/server");
	const request = getRequest();
	if (!request) {
		return null;
	}

	const { auth } = await import("~/server/auth/auth");
	const session = await auth.api.getSession({
		headers: request.headers,
		asResponse: true,
	});

	// Forward any Set-Cookie headers (e.g., session refresh)
	const cookies = session.headers?.getSetCookie();
	if (cookies?.length) {
		setResponseHeader("Set-Cookie", cookies);
	}

	const data = await session.json();
	return data?.user || null;
}

export const getSessionUser = createServerFn({ method: "GET" }).handler(handleGetSessionUser);
