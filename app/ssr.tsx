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
	// Get locale from request and initialize i18n
	const locale = (getLocale(ctx.request) ||
		DEFAULT_LANGUAGE) as SupportedLanguage;
	await activateLanguage(locale);

	// Call the default stream handler
	return defaultStreamHandler(ctx);
};

export default createStartHandler({
	createRouter,
	getRouterManifest,
})(i18nStreamHandler);
