/**
 * Client-side application entry point
 * Sets up router and renders the app
 * Handles client-side hydration
 */

/// <reference types="vinxi/types/client" />
import { StartClient } from "@tanstack/start";
import { hydrateRoot } from "react-dom/client";
import { clientEnv } from "~/lib/env-client";
import { MonitoringProvider, clientConfig } from "~/lib/monitoring";
import {
	DEFAULT_LANGUAGE,
	activateLanguage,
	normalizeLocale,
} from "~/locales/locale";
import { createRouter } from "./router";

// Initialize i18n with browser language
try {
	const browserLocale = normalizeLocale(navigator.language);
	await activateLanguage(browserLocale);
} catch (error) {
	// If browser language initialization fails, fallback to default language
	console.error("Failed to initialize i18n with browser language:", error);
	await activateLanguage(DEFAULT_LANGUAGE);
}

const router = createRouter();

// Ensure Rollbar is only initialized on the client side
const isClient = typeof window !== "undefined";
const hasToken = Boolean(clientEnv.PUBLIC_ROLLBAR_ACCESS_TOKEN);

// Debug Rollbar configuration - uncomment to troubleshoot
/*
console.log("=== ROLLBAR DEBUG ===");
console.log("Client Rollbar Config:", {
	isClient,
	hasToken,
	accessToken: clientEnv.PUBLIC_ROLLBAR_ACCESS_TOKEN ? "[present]" : "[missing]",
	enabled: isClient && hasToken,
	clientConfig: {
		...clientConfig,
		accessToken: clientConfig.accessToken ? "[present]" : "[missing]",
	},
});
console.log("===================");
*/

hydrateRoot(
	document,
	<MonitoringProvider
		config={{ ...clientConfig, enabled: isClient && hasToken }}
	>
		<StartClient router={router} />
	</MonitoringProvider>,
);
