import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "@tanstack/start/server";
import { auth } from "~/server/auth/auth";
import { checkPlaywrightTestAuth } from "~/utils/test/playwright";

export const getSessionUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const mockUser = checkPlaywrightTestAuth();
		if (mockUser) {
			return mockUser;
		}

		// Normal auth flow
		const request = getWebRequest();
		if (!request) {
			return null;
		}

		const session = await auth.api.getSession({ headers: request.headers });
		return session?.user || null;
	},
);
