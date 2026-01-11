import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { auth } from "~/server/auth/auth";
import { checkPlaywrightTestAuth } from "~/utils/test/playwright";

/**
 * Middleware to force authentication on a server function, and add the user to the context.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) {
		return next({ context: { user: mockUser } });
	}

	// Normal auth flow
	const request = getRequest();
	if (!request) {
		setResponseStatus(500);
		throw new Error("No web request available");
	}

	const session = await auth.api.getSession({
		headers: request.headers,
		query: {
			// ensure session is fresh
			// https://www.better-auth.com/docs/concepts/session-management#session-caching
			disableCookieCache: true,
		},
		asResponse: true,
	});

	// Forward any Set-Cookie headers (e.g., session refresh)
	const cookies = session.headers?.getSetCookie();
	if (cookies?.length) {
		setResponseHeader("Set-Cookie", cookies);
	}

	const data = await session.json();

	if (!data?.user) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return next({ context: { user: data.user } });
});
