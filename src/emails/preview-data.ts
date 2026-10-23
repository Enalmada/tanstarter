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
	supportEmail: "support@tanstarter.dev",
} as const satisfies VerifyEmailProps;
