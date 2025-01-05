/// <reference types="vinxi/types/server" />
import { getRouterManifest } from "@tanstack/start/router-manifest";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/start/server";
import {
	DEFAULT_LANGUAGE,
	type SupportedLanguage,
	activateLanguage,
	getLocale,
} from "~/locales/locale";

import { createRouter } from "./router";

// Create a custom stream handler that initializes i18n
const i18nStreamHandler = async (ctx: any) => {
	try {
		// Get locale from request and initialize i18n
		const locale = (getLocale(ctx.request) ||
			DEFAULT_LANGUAGE) as SupportedLanguage;
		await activateLanguage(locale);

		return defaultStreamHandler(ctx);
	} catch (error) {
		// If i18n initialization fails, fallback to default language
		console.error("Failed to initialize i18n:", error);
		await activateLanguage(DEFAULT_LANGUAGE);
		return defaultStreamHandler(ctx);
	}
};

export default createStartHandler({
	createRouter,
	getRouterManifest,
})(i18nStreamHandler);
