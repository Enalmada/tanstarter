/**
 * Request middleware: a fresh Lingui instance per request, with the catalog
 * for the resolved locale loaded, handed to the router through the start
 * context (see src/router.tsx). Registered in src/start.ts.
 *
 * Reachable from start.ts, so it imports nothing server-only (TSS-2).
 */

import { setupI18n } from "@lingui/core";
import { createMiddleware } from "@tanstack/react-start";
import { DEFAULT_LOCALE, dynamicActivate } from "./locales";
import { resolveLocale, serializeLocaleCookie } from "./resolve-locale";

export const i18nMiddleware = createMiddleware({ type: "request" }).server(async ({ request, next, handlerType }) => {
	// Server functions render nothing
	if (handlerType === "serverFn") return next();

	const { locale, persist } = resolveLocale({
		url: request.url,
		cookieHeader: request.headers.get("cookie"),
		acceptLanguage: request.headers.get("accept-language"),
	});

	const i18n = setupI18n();
	let activeLocale = locale;
	try {
		await dynamicActivate(i18n, locale);
	} catch {
		activeLocale = DEFAULT_LOCALE;
		await dynamicActivate(i18n, activeLocale);
	}

	const result = await next({ context: { i18n } });
	const { headers } = result.response;
	// Only documents depend on the locale; API and asset responses are left alone
	if (!(headers.get("content-type") ?? "").includes("text/html")) return result;

	// The page depends on the cookie and Accept-Language: shared caches must key on them
	headers.append("Vary", "Cookie, Accept-Language");
	if (persist && activeLocale === locale) {
		headers.append("Set-Cookie", serializeLocaleCookie(locale, { secure: process.env.NODE_ENV === "production" }));
		// Never let a shared cache store (and replay) a response that sets the preference cookie
		headers.set("Cache-Control", "private, no-store");
	}
	return result;
});
