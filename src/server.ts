/**
 * Server-side rendering entry point
 * Handles initial page load and SSR
 * Sets up server-side router and state
 *
 * Note: Security headers (CSP, etc.) are now handled by middleware in src/start.ts
 */

import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
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

// Security headers are now applied via global request middleware in src/start.ts
const fetch = createStartHandler(enhancedStreamHandler);

export default {
	fetch,
};
