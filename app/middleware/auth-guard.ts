import { createMiddleware } from "@tanstack/start";
import { getWebRequest, setResponseStatus } from "vinxi/http";
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
	const { headers } = getWebRequest();
	const session = await auth.api.getSession({ headers });

	if (!session) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return next({ context: { user: session.user } });
});
