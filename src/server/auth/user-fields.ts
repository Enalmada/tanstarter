/**
 * User-field policy for better-auth, shared by `auth.ts` and its tests.
 *
 * Every `additionalFields` entry is server-owned (`input: false`): better-auth
 * strips client-supplied values ONLY when `input === false`, and
 * `src/routes/api/auth/$.ts` forwards every `/api/auth/*` request to
 * `auth.handler`. Without it, `POST /api/auth/sign-up/email` with
 * `"role":"ADMIN"` creates an admin.
 */

import { UserRole } from "~/lib/enums/user-role";
import { shouldPromoteOnCreate } from "./admin-emails";

export const userAdditionalFields = {
	role: {
		type: "string",
		defaultValue: UserRole.MEMBER,
		input: false,
	},
} as const;

export const userDatabaseHooks = {
	user: {
		create: {
			// Optional ADMIN_EMAILS bootstrap — see ./admin-emails for why this
			// runs only at creation and only for verified rows. process.env (not
			// `env`) for the same dev-bundling reason as the Google credentials
			// in auth.ts.
			before: async <T extends { email?: string | null; emailVerified?: boolean | null }>(user: T) => {
				if (shouldPromoteOnCreate(user, process.env.ADMIN_EMAILS)) {
					return { data: { ...user, role: UserRole.ADMIN } };
				}
				return { data: user };
			},
		},
	},
};

// The app never calls /update-user; leaving it mounted lets clients write raw
// `name`/`image` (and any future additionalField) past app validation.
export const authDisabledPaths = ["/update-user"];
