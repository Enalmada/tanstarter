import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "~/server/auth/auth";

const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_BASE_URL,
	plugins: [inferAdditionalFields<typeof auth>()],
});

export default authClient;

export type Session = typeof authClient.$Infer.Session;
export type SessionUser = typeof authClient.$Infer.Session.user;
