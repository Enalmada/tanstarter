import { PASSWORD_RESET_LINK_MINUTES } from "~/lib/auth/password-reset";
import { VERIFICATION_LINK_MINUTES } from "~/lib/auth/verification-link";
import type { AccountExistsEmailProps } from "./AccountExistsEmail";
import type { ResetPasswordEmailProps } from "./ResetPasswordEmail";
import type { VerifyEmailProps } from "./VerifyEmail";
import type { WelcomeEmailProps } from "./WelcomeEmail";

// Use Required to ensure all props have concrete values for preview data
// This avoids exactOptionalPropertyTypes issues in stories
export const welcomeEmailPreview = {
	username: "Jordan",
	appName: "TanStarter",
	gettingStartedUrl: "https://app.tanstarter.dev/getting-started",
	supportEmail: "support@tanstarter.dev",
	unsubscribeUrl: "https://app.tanstarter.dev/settings/notifications",
} as const satisfies Required<WelcomeEmailProps>;

export const verifyEmailPreview = {
	appName: "TanStarter",
	verificationUrl: "https://app.tanstarter.dev/api/auth/verify-email?token=preview&callbackURL=%2Ftasks",
	linkValidMinutes: VERIFICATION_LINK_MINUTES,
	supportEmail: "support@tanstarter.dev",
} as const satisfies VerifyEmailProps;

export const resetPasswordEmailPreview = {
	appName: "TanStarter",
	resetUrl: "https://app.tanstarter.dev/api/auth/reset-password/preview?callbackURL=%2Freset-password",
	linkValidMinutes: PASSWORD_RESET_LINK_MINUTES,
	supportEmail: "support@tanstarter.dev",
} as const satisfies ResetPasswordEmailProps;

export const accountExistsEmailPreview = {
	appName: "TanStarter",
	signInUrl: "https://app.tanstarter.dev/signin",
	forgotPasswordUrl: "https://app.tanstarter.dev/forgot-password",
	supportEmail: "support@tanstarter.dev",
} as const satisfies AccountExistsEmailProps;
