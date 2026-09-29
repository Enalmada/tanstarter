import { expect, test } from "@playwright/test";

/**
 * Theme (src/components/theme-provider.tsx)
 *
 * An inline script (through ScriptOnce, so it carries the CSP nonce) sets the
 * light/dark class and color-scheme on <html> before first paint. The toggle offers
 * Light, Dark and System; System follows the OS setting live.
 */
const html = (page: import("@playwright/test").Page) => page.locator("html");

async function chooseTheme(page: import("@playwright/test").Page, name: "Light" | "Dark" | "System") {
	const item = page.getByRole("menuitemradio", { name });
	// The first click can land before hydration; retry until the menu opens
	await expect(async () => {
		if (!(await item.isVisible())) await page.getByRole("button", { name: "Toggle theme" }).first().click();
		await expect(item).toBeVisible({ timeout: 1_000 });
	}).toPass({ timeout: 15_000 });
	await item.click();
}

test.describe("Theme", () => {
	test("uses the OS setting when nothing is stored", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto("/");
		await expect(html(page)).toHaveClass(/\bdark\b/);
		await expect(html(page)).toHaveCSS("color-scheme", "dark");

		await page.emulateMedia({ colorScheme: "light" });
		await page.goto("/");
		await expect(html(page)).toHaveClass(/\blight\b/);
		await expect(html(page)).toHaveCSS("color-scheme", "light");
	});

	test("a stored choice wins over the OS setting and survives a reload without a flash", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto("/");
		await chooseTheme(page, "Light");
		await expect(html(page)).toHaveClass(/\blight\b/);
		expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");

		// Record the class as soon as <html> exists, before hydration: it must never be "dark"
		await page.addInitScript(() => {
			const seen: string[] = [];
			(window as unknown as { __themeSeen: string[] }).__themeSeen = seen;
			const record = () => seen.push(document.documentElement.className);
			new MutationObserver(record).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
		});
		await page.reload();
		await expect(html(page)).toHaveClass(/\blight\b/);
		const seen = await page.evaluate(() => (window as unknown as { __themeSeen: string[] }).__themeSeen);
		expect(seen.filter((c) => /\bdark\b/.test(c))).toEqual([]);
	});

	test("System follows the OS setting live", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "light" });
		await page.goto("/");
		await chooseTheme(page, "Dark");
		await expect(html(page)).toHaveClass(/\bdark\b/);

		await chooseTheme(page, "System");
		await expect(html(page)).toHaveClass(/\blight\b/);
		await page.emulateMedia({ colorScheme: "dark" });
		await expect(html(page)).toHaveClass(/\bdark\b/);
		await expect(html(page)).toHaveCSS("color-scheme", "dark");
	});

	test("the previous stored values still apply", async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem("theme", "dark"));
		await page.emulateMedia({ colorScheme: "light" });
		await page.goto("/");
		await expect(html(page)).toHaveClass(/\bdark\b/);
	});

	test("first paint is themed before any client script runs, even when storage is blocked", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await page.addInitScript(() => {
			Object.defineProperty(window, "localStorage", {
				get() {
					throw new Error("blocked");
				},
			});
		});
		// Only the inline theme script can set the class now
		await page.route("**/*", (route) =>
			route.request().resourceType() === "script" ? route.abort() : route.continue(),
		);
		await page.goto("/");
		await expect(html(page)).toHaveClass(/\bdark\b/);
		await expect(html(page)).toHaveCSS("color-scheme", "dark");
	});

	test("the theme script does not trigger CSP or console errors", async ({ page }) => {
		const problems: string[] = [];
		page.on("console", (message) => {
			if (message.type() === "error") problems.push(message.text());
		});
		page.on("pageerror", (error) => problems.push(error.message));
		await page.goto("/");
		await expect(html(page)).toHaveClass(/\b(light|dark)\b/);
		expect(problems.filter((p) => /content security policy|nonce|hydrat/i.test(p))).toEqual([]);
	});
});
