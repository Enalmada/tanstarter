/**
 * Server-side rendering entry point
 * Handles initial page load and SSR
 * Sets up server-side router and state
 */

import { createSecureHandler } from "@enalmada/start-secure";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { cspRules } from "~/config/cspRules";
import { activateLanguage, DEFAULT_LANGUAGE, getLocale, type SupportedLanguage } from "~/locales/locale";

// Create a custom stream handler that initializes i18n and handles errors
const enhancedStreamHandler = async (ctx: Parameters<typeof defaultStreamHandler>[0]) => {
	try {
		// Get locale from request and initialize i18n
		const locale = (getLocale(ctx.request) || DEFAULT_LANGUAGE) as SupportedLanguage;
		await activateLanguage(locale);

		return await defaultStreamHandler(ctx);
	} catch (_error) {
		await activateLanguage(DEFAULT_LANGUAGE);
		return defaultStreamHandler(ctx);
	}
};

// Apply security headers
const secureHandler = createSecureHandler({
	rules: cspRules,
	options: {
		isDev: process.env.NODE_ENV !== "production",
	},
});

const fetch = secureHandler(createStartHandler(enhancedStreamHandler));

export default {
	fetch,
};
