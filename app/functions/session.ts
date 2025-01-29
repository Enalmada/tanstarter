import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "@tanstack/start/server";
import { auth } from "~/server/auth/auth";

export const getSessionUser = createServerFn({ method: "GET" }).handler(
	async () => {
		// Normal auth flow
		const request = getWebRequest();
		if (!request) {
			return null;
		}

		const session = await auth.api.getSession({ headers: request.headers });
		return session?.user || null;
	},
);
