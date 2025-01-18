import { createMiddleware } from "@tanstack/start";
import { getWebRequest, setResponseStatus } from "vinxi/http";
import { auth } from "~/server/auth/auth";
import { mockAdminUser, mockTestUser } from "~/utils/test/mock-users";

/**
 * Middleware to force authentication on a server function, and add the user to the context.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const { headers } = getWebRequest();
	const authHeader = headers.get("authorization");

	// In development, check for test tokens first
	// TODO consider replacing this with email login
	if (process.env.NODE_ENV === "development") {
		if (authHeader === "playwright-test-token") {
			return next({ context: { user: mockTestUser } });
		}
		if (authHeader === "playwright-admin-test-token") {
			return next({ context: { user: mockAdminUser } });
		}
	}

	// Normal auth flow
	const session = await auth.api.getSession({ headers });

	if (!session) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return next({ context: { user: session.user } });
});
