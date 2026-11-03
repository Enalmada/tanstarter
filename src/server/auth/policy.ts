/**
 * Sign-in policy shared by `auth.ts` and its tests, so a test exercises the
 * values that actually ship.
 *
 * - Email and password sign-ups must verify their address before they get a
 *   session. Google sign-ins arrive verified. The Playwright dev server (see
 *   `isPlaywrightServer`) skips it because the e2e run has no inbox; the
 *   enforced behavior is covered by `__tests__/policy.test.ts`.
 * - Following the emailed link verifies the address but does not sign anyone in
 *   (`autoSignInAfterVerification: false`). The link proves only that someone
 *   controls the mailbox, not who chose the password: with auto sign-in, an
 *   attacker who registered a victim's address with their own password would
 *   get the victim to sign the attacker's account in.
 * - Google never links into an existing account. `disableImplicitLinking` stops
 *   the sign-in path, and the explicit `/link-social` endpoint (which governs
 *   nothing else and which the app never calls) is disabled in `user-fields`.
 *   A verified email/password row could otherwise be taken over the same way:
 *   the squatter's row becomes verified when the owner clicks the link, then the
 *   owner's Google sign-in merges into it while the squatter's password works.
 * - With no way to send mail (see `emailDelivery`), email sign-up is off instead
 *   of creating accounts nobody can verify. Every address gets the same refusal.
 * - A forgotten password is recoverable, which is also how the owner of a squatted
 *   address (someone registered it with their own password) gets it back. A reset
 *   revokes every session of the account, so the squatter's sessions die with the
 *   old password. It does not touch `emailVerified` (better-auth leaves it alone):
 *   an unverified account still has to follow a verification link, and signing in
 *   sends a new one. Reset is off when mail cannot be sent, for every address alike.
 *   Requesting one answers the same for every address. A sign-up for an address that
 *   already has an account answers like a new one and mails the owner instead.
 * - Sessions slide: each use past `updateAge` pushes the expiry out by
 *   `expiresIn`, so a session ends after 7 days without use. There is no
 *   absolute lifetime cap.
 */

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "~/lib/auth/password-policy";
import { PASSWORD_RESET_LINK_MINUTES } from "~/lib/auth/password-reset";
import { VERIFICATION_LINK_MINUTES } from "~/lib/auth/verification-link";

export const SESSION_IDLE_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_REFRESH_SECONDS = 24 * 60 * 60;
export const VERIFICATION_LINK_SECONDS = VERIFICATION_LINK_MINUTES * 60;
export const PASSWORD_RESET_LINK_SECONDS = PASSWORD_RESET_LINK_MINUTES * 60;

type MailHandler<Data> = (data: Data) => Promise<void>;

/**
 * The mail handlers are passed in so tests can capture what would be sent. They must not wait on the send:
 * they run inside the request, and a wait that only happens for an address with an account would show
 * which addresses have one (see `sendVerificationEmail`).
 */
export function createAuthPolicy({
	requireEmailVerification,
	canSendEmail,
	sendResetPassword,
	onExistingUserSignUp,
}: {
	requireEmailVerification: boolean;
	canSendEmail: boolean;
	sendResetPassword: MailHandler<{ user: { email: string }; url: string }>;
	onExistingUserSignUp: MailHandler<{ user: { email: string } }>;
}) {
	return {
		emailAndPassword: {
			enabled: true,
			requireEmailVerification,
			disableSignUp: requireEmailVerification && !canSendEmail,
			minPasswordLength: MIN_PASSWORD_LENGTH,
			maxPasswordLength: MAX_PASSWORD_LENGTH,
			resetPasswordTokenExpiresIn: PASSWORD_RESET_LINK_SECONDS,
			revokeSessionsOnPasswordReset: true,
			// Without it better-auth refuses every reset request alike (RESET_PASSWORD_DISABLED)
			...(canSendEmail ? { sendResetPassword } : {}),
			onExistingUserSignUp,
		},
		emailVerification: {
			sendOnSignUp: true,
			// Someone who signs in before verifying gets a fresh link
			sendOnSignIn: true,
			autoSignInAfterVerification: false,
			expiresIn: VERIFICATION_LINK_SECONDS,
		},
		account: { accountLinking: { disableImplicitLinking: true } },
		session: {
			expiresIn: SESSION_IDLE_SECONDS,
			updateAge: SESSION_REFRESH_SECONDS,
		},
	} as const;
}
