import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "~/server/auth/auth";
import type { UserRole } from "~/server/db/schema";

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

// Narrow the inferred `role: string` to the UserRole enum (see ~/server/auth/auth.ts).
export type SessionUser = typeof authClient.$Infer.Session.user & {
	role: UserRole;
};
