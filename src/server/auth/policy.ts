/**
 * Sign-in policy shared by `auth.ts` and its tests, so a test exercises the
 * values that actually ship.
 *
 * - Email and password sign-ups must verify their address before they get a
 *   session. Google sign-ins arrive verified. The Playwright dev server (see
 *   `isPlaywrightServer`) skips it because the e2e run has no inbox; the
 *   enforced behavior is covered by `__tests__/policy.test.ts`.
 * - Sessions slide: each use past `updateAge` pushes the expiry out by
 *   `expiresIn`, so a session ends after 7 days without use. There is no
 *   absolute lifetime cap.
 */

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "~/lib/auth/password-policy";
import { VERIFICATION_LINK_MINUTES } from "~/lib/auth/verification-link";

export const SESSION_IDLE_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_REFRESH_SECONDS = 24 * 60 * 60;
export const VERIFICATION_LINK_SECONDS = VERIFICATION_LINK_MINUTES * 60;

export function createAuthPolicy({ requireEmailVerification }: { requireEmailVerification: boolean }) {
	return {
		emailAndPassword: {
			enabled: true,
			requireEmailVerification,
			minPasswordLength: MIN_PASSWORD_LENGTH,
			maxPasswordLength: MAX_PASSWORD_LENGTH,
		},
		emailVerification: {
			sendOnSignUp: true,
			// Someone who signs in before verifying gets a fresh link
			sendOnSignIn: true,
			autoSignInAfterVerification: true,
			expiresIn: VERIFICATION_LINK_SECONDS,
		},
		session: {
			expiresIn: SESSION_IDLE_SECONDS,
			updateAge: SESSION_REFRESH_SECONDS,
		},
	} as const;
}
