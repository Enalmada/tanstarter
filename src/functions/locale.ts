import { createServerFn } from "@tanstack/react-start";
import { picklist, safeParse } from "valibot";
import { LOCALE_COOKIE, LOCALES, type Locale } from "~/lib/i18n/locales";
import { BadRequestError } from "~/server/access/http-errors";

const localeSchema = picklist(Object.keys(LOCALES) as [Locale, ...Locale[]]);

function validateLocale(input: unknown) {
	const result = safeParse(localeSchema, input);
	if (!result.success) throw new BadRequestError("Unsupported locale");
	return result.output;
}

/**
 * Remembers the visitor's language. The cookie is HttpOnly and the client reads
 * the language from the page (see src/lib/i18n/router-plugin.tsx), so the
 * browser never needs to see it.
 */
export const updateLocale = createServerFn({ method: "POST" })
	.validator(validateLocale)
	.handler(async ({ data }) => {
		const { setCookie } = await import("@tanstack/react-start/server");
		setCookie(LOCALE_COOKIE, data, {
			path: "/",
			maxAge: 60 * 60 * 24 * 365,
			sameSite: "lax",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});
		return data;
	});
