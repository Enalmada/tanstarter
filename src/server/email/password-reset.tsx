import "@tanstack/react-start/server-only";
import { AccountExistsEmail, ResetPasswordEmail } from "~/emails";
import { env } from "~/env";
import { PASSWORD_RESET_LINK_MINUTES } from "~/lib/auth/password-reset";
import { logger } from "~/utils/logger";
import { sendEmail } from "./send-email";

const APP_NAME = "TanStarter";

// Fire and forget, like `sendVerificationEmail`: better-auth answers a reset request or a sign-up the same way for
// every address, and waiting on a send only for an address that has an account would show which ones do. A failed
// send is logged; the person asks again.
function sendInBackground(label: string, send: () => Promise<boolean>, unsent: Record<string, unknown> = {}) {
	void (async () => {
		try {
			if (!(await send())) {
				logger.info(`${label} not sent: no email provider configured`, unsent);
			}
		} catch (error) {
			logger.error(`${label} failed`, { error: error instanceof Error ? error.message : String(error) });
		}
	})();
}

/**
 * better-auth's `sendResetPassword`. `url` is better-auth's own endpoint: it checks the token and then redirects to
 * the reset page, so an expired or used link ends on a readable page. Without a provider (local development) the
 * link is printed so a developer can follow it. In production the policy leaves reset off when mail cannot be sent
 * (see `emailDelivery`).
 */
export function sendResetPasswordEmail({ user, url }: { user: { email: string }; url: string }) {
	sendInBackground(
		"Password reset email",
		() =>
			sendEmail({
				to: user.email,
				subject: `Reset your ${APP_NAME} password`,
				react: <ResetPasswordEmail appName={APP_NAME} resetUrl={url} linkValidMinutes={PASSWORD_RESET_LINK_MINUTES} />,
			}),
		{ resetUrl: url },
	);
}

/**
 * better-auth's `onExistingUserSignUp`: tells the owner that someone tried to register their address. This is the
 * only signal they get, since the sign-up page answers the same for every address.
 */
export function sendAccountExistsEmail({ user }: { user: { email: string } }) {
	const baseUrl = env.PUBLIC_APP_URL || "http://localhost:3000";
	sendInBackground("Account exists email", () =>
		sendEmail({
			to: user.email,
			subject: `You already have a ${APP_NAME} account`,
			react: (
				<AccountExistsEmail
					appName={APP_NAME}
					signInUrl={new URL("/signin", baseUrl).href}
					forgotPasswordUrl={new URL("/forgot-password", baseUrl).href}
				/>
			),
		}),
	);
}
