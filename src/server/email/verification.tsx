import "@tanstack/react-start/server-only";
import { VerifyEmail } from "~/emails";
import { VERIFICATION_LINK_MINUTES } from "~/lib/auth/verification-link";
import { logger } from "~/utils/logger";
import { sendEmail } from "./send-email";

const APP_NAME = "TanStarter";

/**
 * better-auth's `sendVerificationEmail`. Not awaited: better-auth advises
 * against it, because the time a send takes would tell a caller whether the
 * address has an account. Failures are logged instead. Without a provider
 * (local dev) the link is printed so a developer can follow it.
 */
export function sendVerificationEmail({ user, url }: { user: { email: string; name?: string | null }; url: string }) {
	void (async () => {
		try {
			const sent = await sendEmail({
				to: user.email,
				subject: `Verify your email for ${APP_NAME}`,
				react: <VerifyEmail appName={APP_NAME} verificationUrl={url} linkValidMinutes={VERIFICATION_LINK_MINUTES} />,
			});
			if (!sent) {
				logger.info("Verification email not sent: no email provider configured", { verificationUrl: url });
			}
		} catch (error) {
			logger.error("Verification email failed", { error: error instanceof Error ? error.message : String(error) });
		}
	})();
}
