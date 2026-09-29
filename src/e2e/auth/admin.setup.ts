import { expect, test as setup } from "@playwright/test";
import { PLAYWRIGHT_ADMIN_USER } from "~/utils/test/playwright-users";

/**
 * Admin sign-in check. The admin project sends the admin test token on
 * every request (extraHTTPHeaders in playwright.config.ts); this fails fast,
 * with a hint, when the token doesn't resolve to the seeded admin.
 */
setup("authenticate as admin", async ({ page, context }) => {
	await context.setExtraHTTPHeaders({ authorization: PLAYWRIGHT_ADMIN_USER.token });

	await page.goto("/admin");
	await expect(
		page,
		"admin test token did not sign in: is the database seeded (bun run drizzle:seed) and was the dev server started by Playwright (PLAYWRIGHT=true)?",
	).toHaveURL(/\/admin$/);
	await expect(page.getByText("Admin Dashboard", { exact: true })).toBeVisible();

	// Kept for the admin project's storageState; the auth itself is the header.
	await context.storageState({ path: "playwright/.auth/admin.json" });
});
