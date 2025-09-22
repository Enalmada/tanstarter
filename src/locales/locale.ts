/**
 * Internationalization configuration
 * Manages language loading and switching
 * Handles locale detection and activation
 */

import { i18n } from "@lingui/core";

export const AVAILABLE_LANGUAGES = {
	en: "English",
	es: "Spanish",
} as const;

export type SupportedLanguage = keyof typeof AVAILABLE_LANGUAGES;
export const DEFAULT_LANGUAGE = "en" as const;

export function normalizeLocale(locale: string): SupportedLanguage {
	// Convert locale like 'en-US' to 'en'
	const baseLocale = locale.split("-")[0];
	return isValidLanguage(baseLocale) ? baseLocale : DEFAULT_LANGUAGE;
}

export function isValidLanguage(
	language: string | null | undefined,
): language is SupportedLanguage {
	if (!language) return false;
	return Object.keys(AVAILABLE_LANGUAGES).includes(language);
}

export function getBrowserLanguage(acceptLanguage: string | null) {
	const languages = acceptLanguage?.split(",") ?? [];
	const firstLanguage = languages[0]?.split(";")[0] ?? DEFAULT_LANGUAGE;
	return normalizeLocale(firstLanguage);
}

export function getLocale(request: Request) {
	// Try to get locale from Accept-Language header
	const acceptLanguage = request.headers.get("accept-language");
	return getBrowserLanguage(acceptLanguage);
}

export async function activateLanguage(language: SupportedLanguage) {
	const { messages } = await import(`./${language}/messages.po`);
	i18n.loadAndActivate({ locale: language, messages });
}
