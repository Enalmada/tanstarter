import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "~/server/auth/auth";

/**
 * Better Auth client with type inference
 *
 * NOTE: This causes development-time client-side execution of server auth config,
 * which is why ~/server/auth/auth.ts uses process.env for Google OAuth credentials
 * instead of envin's validated env variables. See auth.ts for detailed explanation.
 *
 * Production builds work fine - this is purely a development bundling issue.
 */
const authClient = createAuthClient({
	plugins: [inferAdditionalFields<typeof auth>()],
});

export default authClient;

export type Session = typeof authClient.$Infer.Session;
export type SessionUser = typeof authClient.$Infer.Session.user;
