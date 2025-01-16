import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "~/env";
import type { auth } from "~/server/auth/auth";

const authClient = createAuthClient({
	baseURL: env.CF_PAGES_URL || env.VITE_APP_BASE_URL,
	plugins: [inferAdditionalFields<typeof auth>()],
});

export default authClient;

export type Session = typeof authClient.$Infer.Session;
export type SessionUser = typeof authClient.$Infer.Session.user;
