/**
 * Server-side rendering entry point
 * Handles initial page load and SSR
 * Sets up server-side router and state
 */

/// <reference types="vinxi/types/server" />
import { getRouterManifest } from "@tanstack/start/router-manifest";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/start/server";
import { monitor } from "~/lib/monitoring";
import {
	DEFAULT_LANGUAGE,
	type SupportedLanguage,
	activateLanguage,
	getLocale,
} from "~/locales/locale";

import { createRouter } from "./router";

// Create a custom stream handler that initializes i18n and handles errors
const enhancedStreamHandler = async (
	ctx: Parameters<typeof defaultStreamHandler>[0],
) => {
	try {
		// Get locale from request and initialize i18n
		const locale = (getLocale(ctx.request) ||
			DEFAULT_LANGUAGE) as SupportedLanguage;
		await activateLanguage(locale);

		try {
			return await defaultStreamHandler(ctx);
		} catch (error) {
			monitor.error("Error in stream handler:", error);
			throw error;
		}
	} catch (error) {
		// If i18n initialization fails, fallback to default language and log
		monitor.error("Failed to initialize i18n:", error);
		console.error("Failed to initialize i18n:", error);
		await activateLanguage(DEFAULT_LANGUAGE);
		return defaultStreamHandler(ctx);
	}
};

export default createStartHandler({
	createRouter,
	getRouterManifest,
})(enhancedStreamHandler);
