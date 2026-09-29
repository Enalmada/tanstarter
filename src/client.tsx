/**
 * Client-side application entry point
 * Sets up router and renders the app
 * Handles client-side hydration
 */

import { StartClient } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";
import { activateLanguage, DEFAULT_LANGUAGE, normalizeLocale } from "~/locales/locale";

// Initialize i18n with browser language - avoid top-level await for hydration safety
const initializeApp = async () => {
	// PostHog (analytics + exception autocapture) as early as possible, without
	// holding up hydration or putting posthog-js in the main chunk.
	import("~/lib/monitoring/client").then((mod) => mod.initPosthog()).catch(() => {});

	try {
		const browserLocale = normalizeLocale(navigator.language);
		await activateLanguage(browserLocale);
	} catch (_error) {
		await activateLanguage(DEFAULT_LANGUAGE);
	}

	hydrateRoot(document, <StartClient />);
};

// Start the application
initializeApp().catch((_error) => {});
