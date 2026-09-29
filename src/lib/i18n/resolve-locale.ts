/**
 * Picks the locale for a request. Pure (no server imports), so it is safe to
 * reach from src/start.ts and easy to test.
 *
 * Order:
 * 1. `?locale=es`: an explicit choice, remembered in the cookie.
 * 2. the `locale` cookie: a choice made earlier (language switcher).
 * 3. `Accept-Language`, highest q first (`es-MX` counts as `es`).
 * 4. English.
 *
 * Only an explicit choice sets the cookie, so ordinary responses carry no
 * Set-Cookie and stay cacheable.
 */

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./locales";

export interface LocaleRequest {
	url: string;
	cookieHeader: string | null;
	acceptLanguage: string | null;
}

export interface ResolvedLocale {
	locale: Locale;
	/** The choice was explicit and should be written to the cookie. */
	persist: boolean;
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// RFC 9110 qvalue: 0 to 1 with at most three decimals
const QVALUE = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

function readCookie(cookieHeader: string | null, name: string): string | undefined {
	for (const part of cookieHeader?.split(";") ?? []) {
		const [key, ...rest] = part.trim().split("=");
		if (key !== name) continue;
		try {
			return decodeURIComponent(rest.join("="));
		} catch {
			// Malformed percent-encoding: treat the cookie as absent instead of failing the request
			return undefined;
		}
	}
	return undefined;
}

function fromAcceptLanguage(header: string | null): Locale | undefined {
	const ranked = (header ?? "")
		.split(",")
		.map((entry) => {
			const [tag = "", ...params] = entry.trim().split(";");
			const q = params.map((param) => param.trim()).find((param) => /^q=/i.test(param));
			const raw = q?.slice(2).trim();
			// An invalid weight drops the entry rather than guessing
			const weight = raw === undefined ? 1 : QVALUE.test(raw) ? Number.parseFloat(raw) : 0;
			return { base: tag.trim().toLowerCase().split("-")[0], weight };
		})
		.filter((entry) => entry.weight > 0)
		.sort((a, b) => b.weight - a.weight);
	return ranked.map((entry) => entry.base).find(isLocale);
}

export function resolveLocale({ url, cookieHeader, acceptLanguage }: LocaleRequest): ResolvedLocale {
	let queryLocale: string | null = null;
	try {
		queryLocale = new URL(url).searchParams.get("locale");
	} catch {
		// A malformed URL falls through to the cookie and header
	}
	if (isLocale(queryLocale)) return { locale: queryLocale, persist: true };

	const cookieLocale = readCookie(cookieHeader, LOCALE_COOKIE);
	if (isLocale(cookieLocale)) return { locale: cookieLocale, persist: false };

	return { locale: fromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE, persist: false };
}

/** A functional preference cookie: not sensitive, so `Lax`; the browser reads the locale from the page, so it can be HttpOnly. */
export function serializeLocaleCookie(locale: Locale, options: { secure: boolean }): string {
	const attributes = [
		`${LOCALE_COOKIE}=${locale}`,
		"Path=/",
		`Max-Age=${ONE_YEAR_SECONDS}`,
		"SameSite=Lax",
		"HttpOnly",
	];
	if (options.secure) attributes.push("Secure");
	return attributes.join("; ");
}
