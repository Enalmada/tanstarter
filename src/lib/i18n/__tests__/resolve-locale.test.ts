import { describe, expect, it } from "vitest";
import { resolveLocale, serializeLocaleCookie } from "~/lib/i18n/resolve-locale";

function resolve(overrides: Partial<Parameters<typeof resolveLocale>[0]> = {}) {
	return resolveLocale({ url: "https://app.test/", cookieHeader: null, acceptLanguage: null, ...overrides });
}

describe("resolveLocale", () => {
	it("defaults to English without persisting", () => {
		expect(resolve()).toEqual({ locale: "en", persist: false });
	});

	it("follows Accept-Language, highest q first, regions reduced to the language", () => {
		expect(resolve({ acceptLanguage: "es-MX,es;q=0.9,en;q=0.5" }).locale).toBe("es");
		expect(resolve({ acceptLanguage: "fr;q=0.9,en;q=0.8,es;q=0.5" }).locale).toBe("en");
		expect(resolve({ acceptLanguage: "es;q=0.4,en;q=0.9" }).locale).toBe("en");
	});

	it("ignores unsupported languages and q=0", () => {
		expect(resolve({ acceptLanguage: "fr,de;q=0.8" }).locale).toBe("en");
		expect(resolve({ acceptLanguage: "es;q=0,en" }).locale).toBe("en");
	});

	it("prefers the cookie to Accept-Language, without persisting", () => {
		expect(resolve({ cookieHeader: "a=b; locale=es", acceptLanguage: "en" })).toEqual({ locale: "es", persist: false });
	});

	it("ignores an invalid cookie value", () => {
		expect(resolve({ cookieHeader: "locale=xx", acceptLanguage: "es" }).locale).toBe("es");
	});

	it("prefers ?locale= to everything and asks to persist it", () => {
		expect(resolve({ url: "https://app.test/?locale=es", cookieHeader: "locale=en", acceptLanguage: "en" })).toEqual({
			locale: "es",
			persist: true,
		});
	});

	it("ignores an invalid ?locale= and a malformed url", () => {
		expect(resolve({ url: "https://app.test/?locale=../../etc", acceptLanguage: "es" })).toEqual({
			locale: "es",
			persist: false,
		});
		expect(resolve({ url: "not a url", cookieHeader: "locale=es" }).locale).toBe("es");
	});

	it("treats a malformed cookie as absent instead of throwing", () => {
		expect(resolve({ cookieHeader: "locale=%", acceptLanguage: "es" }).locale).toBe("es");
		expect(resolve({ cookieHeader: "locale=%E0%A4%A" }).locale).toBe("en");
	});

	it("ignores Accept-Language entries with an invalid weight", () => {
		expect(resolve({ acceptLanguage: "es;q=2,en;q=0.5" }).locale).toBe("en");
		expect(resolve({ acceptLanguage: "es;q=0.5garbage,en;q=0.1" }).locale).toBe("en");
		expect(resolve({ acceptLanguage: "es;q=0.5,en;q=0.1" }).locale).toBe("es");
		expect(resolve({ acceptLanguage: "es;Q=0,en;q=0.8" }).locale).toBe("en");
	});
});

describe("serializeLocaleCookie", () => {
	it("is a lax, http-only, year-long cookie", () => {
		expect(serializeLocaleCookie("es", { secure: false })).toBe(
			"locale=es; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly",
		);
	});

	it("adds Secure when asked", () => {
		expect(serializeLocaleCookie("en", { secure: true })).toMatch(/; Secure$/);
	});
});
