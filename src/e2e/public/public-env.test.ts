import { expect, test } from "@playwright/test";
import { PUBLIC_RUNTIME_ENV_KEYS } from "../../lib/env/public-env";

/**
 * Runtime public env contract (src/lib/env/public-env.ts)
 *
 * The server renders an allowlisted APP_ENV/PUBLIC_* snapshot into the SSR
 * HTML, because Docker/Fly builds have none of those values at build time.
 * Guards what reaches public HTML, that CSP lets it run, and that it runs
 * before the client entry reads it.
 *
 * Under the dev server the build-time fallback in env.config.ts holds the
 * same values, so this can't prove the client used the snapshot rather than
 * the fallback. That needs a build with no public env (the Docker image).
 */
test.describe("Runtime public env", () => {
	test("SSR HTML carries only the allowlisted snapshot, nonce'd, before the client entry", async ({ request }) => {
		const response = await request.get("/");
		expect(response.ok()).toBe(true);
		const html = await response.text();

		const match = html.match(
			/<script nonce="([^"]+)">window\.__PUBLIC_ENV__=(\{.*?\});document\.currentScript\.remove\(\)/,
		);
		expect(match, "public env snapshot script").not.toBeNull();
		const [snapshotTag = "", nonce = "", json = "{}"] = match ?? [];

		const snapshot = JSON.parse(json) as Record<string, unknown>;
		expect(Object.keys(snapshot).every((key) => (PUBLIC_RUNTIME_ENV_KEYS as readonly string[]).includes(key))).toBe(
			true,
		);
		expect(snapshot.APP_ENV).toBe("development");

		// The secrets playwright.config.ts starts the dev server with.
		expect(html).not.toContain("test-auth-secret");
		expect(html).not.toContain("test-client-secret");

		expect(response.headers()["content-security-policy"]).toContain(`'nonce-${nonce}'`);

		const entryIndex = html.indexOf('type="module"');
		expect(entryIndex).toBeGreaterThan(-1);
		expect(html.indexOf(snapshotTag)).toBeLessThan(entryIndex);
	});

	test("browser holds the snapshot after hydration and the script removes itself", async ({ page }) => {
		await page.goto("/");

		await expect.poll(() => page.evaluate(() => window.__PUBLIC_ENV__?.APP_ENV)).toBe("development");
		expect(
			await page.evaluate(() =>
				Array.from(document.scripts).some((script) => script.textContent?.includes("__PUBLIC_ENV__")),
			),
		).toBe(false);
	});
});
