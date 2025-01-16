import { createServerFn } from "@tanstack/start";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { getWebRequest } from "vinxi/http";
import { auth } from "~/server/auth/auth";

const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_BASE_URL,
	plugins: [inferAdditionalFields<typeof auth>()],
});

export default authClient;

export type Session = typeof authClient.$Infer.Session;
export type SessionUser = typeof authClient.$Infer.Session.user;

export const getSessionUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const { headers } = getWebRequest();
		const session = await auth.api.getSession({ headers });

		return session?.user || null;
	},
);
