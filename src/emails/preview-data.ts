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
