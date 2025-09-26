/**
 * Client-side application entry point
 * Sets up router and renders the app
 * Handles client-side hydration
 */

import { StartClient } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";
import { env } from "~/env";
import { MonitoringProvider } from "~/lib/monitoring/MonitoringProvider";
import { activateLanguage, DEFAULT_LANGUAGE, normalizeLocale } from "~/locales/locale";

// Initialize i18n with browser language - avoid top-level await for hydration safety
const initializeApp = async () => {
	try {
		const browserLocale = normalizeLocale(navigator.language);
		await activateLanguage(browserLocale);
	} catch (_error) {
		await activateLanguage(DEFAULT_LANGUAGE);
	}

	// Create safe client-side monitoring config
	const hasToken = Boolean(env.PUBLIC_ROLLBAR_ACCESS_TOKEN);
	const safeClientConfig = {
		enabled: hasToken,
		accessToken: env.PUBLIC_ROLLBAR_ACCESS_TOKEN || "",
		environment: env.APP_ENV || "development",
		captureUncaught: false,
		captureUnhandledRejections: false,
	};

	hydrateRoot(
		document,
		<MonitoringProvider config={safeClientConfig}>
			<StartClient />
		</MonitoringProvider>,
	);
};

// Start the application
initializeApp().catch((_error) => {});
