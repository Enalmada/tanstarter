/**
 * Locale vocabulary and catalog loading, shared by the server and the browser.
 *
 * There is deliberately no global `i18n` here: every request gets its own
 * instance (see ./middleware.ts), because activating a locale on a shared
 * instance while other requests render would leak one user's language into
 * another's response.
 */

import type { I18n } from "@lingui/core";

/** Native names, shown in the language switcher. */
export const LOCALES = {
	en: "English",
	es: "Español",
} as const;

export type Locale = keyof typeof LOCALES;

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
	return typeof value === "string" && Object.hasOwn(LOCALES, value);
}

/** Loads one compiled catalog (a separate chunk per locale) and activates it. */
export async function dynamicActivate(i18n: I18n, locale: Locale) {
	const { messages } = await import(`../../locales/${locale}/messages.po`);
	i18n.loadAndActivate({ locale, messages });
}
