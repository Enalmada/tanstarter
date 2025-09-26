import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "~/server/auth/auth";
import { checkPlaywrightTestAuth } from "~/utils/test/playwright";

export const getSessionUser = createServerFn({ method: "GET" }).handler(async () => {
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) {
		return mockUser;
	}

	// Normal auth flow
	const request = getRequest();
	if (!request) {
		return null;
	}

	const session = await auth.api.getSession({ headers: request.headers });
	return session?.user || null;
});
