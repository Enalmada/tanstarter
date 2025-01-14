import { createMiddleware } from "@tanstack/start";
import { setResponseStatus } from "vinxi/http";
import { getAuthSession } from "~/server/auth/auth";
import type { ClientUser } from "~/server/db/schema";

/**
 * Authentication middleware
 * Protects routes requiring authentication
 * Handles user session validation
 */

/**
 * Middleware to force authentication on a server function, and add the user to the context.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const { user }: { user: ClientUser | null } = await getAuthSession();

	if (!user) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return next({ context: { user } });
});
