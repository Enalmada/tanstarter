/**
 * Client-side application entry point
 * Sets up router and renders the app
 * Handles client-side hydration
 */

/// <reference types="vinxi/types/client" />
import { StartClient } from "@tanstack/start";
import { hydrateRoot } from "react-dom/client";
import { env } from "~/env";
import { getAppEnv, isDevelopment } from "~/lib/env/environment";
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
const hasToken = Boolean(env.PUBLIC_ROLLBAR_ACCESS_TOKEN);

// Debug Rollbar configuration
console.info("=== ROLLBAR DEBUG ===");
console.info("Environment Info:", {
	NODE_ENV: process.env.NODE_ENV,
	hasGlobalEnv: typeof globalThis.__env__ !== "undefined",
	globalEnvKeys: globalThis.__env__ ? Object.keys(globalThis.__env__) : [],
	shouldReportErrors: !isDevelopment(),
	environment: getAppEnv(),
});
console.info("Token Access:", {
	directProcessEnv: process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN
		? "[present]"
		: "[missing]",
	envHelper: env.PUBLIC_ROLLBAR_ACCESS_TOKEN ? "[present]" : "[missing]",
});
console.info("Client Rollbar Config:", {
	isClient,
	hasToken,
	enabled: isClient && hasToken,
	clientConfig: {
		...clientConfig,
		accessToken: clientConfig.accessToken ? "[present]" : "[missing]",
		environment: clientConfig.environment,
		enabled: clientConfig.enabled,
	},
});
console.info("===================");

hydrateRoot(
	document,
	<MonitoringProvider
		config={{ ...clientConfig, enabled: isClient && hasToken }}
	>
		<StartClient router={router} />
	</MonitoringProvider>,
);
