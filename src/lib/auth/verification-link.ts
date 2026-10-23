/** How long an emailed verification link works. Shared by the server policy, the email and the sign-up page. */
export const VERIFICATION_LINK_MINUTES = 60;

/**
 * `callbackURL` for sign-up and sign-in requests, which better-auth bakes into the emailed link. The link
 * lands on the sign-in page, which sends a verified (now signed-in) visitor on to `redirectTarget` and
 * explains an expired or invalid link via `?error=`. Pointing it straight at the app would send a visitor
 * with a bad link through the auth guard, which drops the error.
 */
export function verificationCallback(redirectTarget: string): string {
	return `/signin?redirect=${encodeURIComponent(redirectTarget)}`;
}
