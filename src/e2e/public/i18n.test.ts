import { expect, test } from "@playwright/test";

/**
 * Per-request locale (src/lib/i18n/middleware.ts)
 *
 * Resolution order: ?locale= (sets the cookie) > locale cookie > Accept-Language > en.
 * The server renders the resolved locale into <html lang> and the page body, so
 * the client hydrates with the same catalog.
 */
test.describe("Locale resolution", () => {
	test("defaults to English without setting a cookie", async ({ request }) => {
		const response = await request.get("/", { headers: { "accept-language": "" } });
		const html = await response.text();
		expect(html).toContain('<html lang="en"');
		expect(html).toContain("Get Started");
		expect(response.headers()["set-cookie"]).toBeUndefined();
	});

	test("uses Accept-Language and maps regional variants", async ({ request }) => {
		const response = await request.get("/", { headers: { "accept-language": "es-MX,es;q=0.9,en;q=0.5" } });
		const html = await response.text();
		expect(html).toContain('<html lang="es"');
		expect(html).toContain("Empezar");
	});

	test("?locale= sets a persistent cookie", async ({ request }) => {
		const response = await request.get("/?locale=es");
		expect(response.headers()["set-cookie"]).toMatch(/locale=es;.*Max-Age=31536000.*SameSite=Lax/i);
		expect(await response.text()).toContain('<html lang="es"');
	});

	test("the cookie beats Accept-Language", async ({ request }) => {
		const response = await request.get("/", { headers: { cookie: "locale=en", "accept-language": "es" } });
		expect(await response.text()).toContain('<html lang="en"');
	});

	test("ignores unsupported locales", async ({ request }) => {
		const response = await request.get("/?locale=xx", { headers: { "accept-language": "" } });
		expect(await response.text()).toContain('<html lang="en"');
		expect(response.headers()["set-cookie"]).toBeUndefined();
	});
});
