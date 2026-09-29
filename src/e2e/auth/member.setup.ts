import { expect, test as setup } from "@playwright/test";
import { PLAYWRIGHT_MEMBER_USER } from "~/utils/test/playwright-users";

/**
 * Member sign-in check. The member project sends the member test token on
 * every request (extraHTTPHeaders in playwright.config.ts); this fails fast,
 * with a hint, when the token doesn't resolve to the seeded user.
 */
setup("authenticate as member", async ({ page, context }) => {
	await context.setExtraHTTPHeaders({ authorization: PLAYWRIGHT_MEMBER_USER.token });

	await page.goto("/tasks");
	await expect(
		page,
		"test token did not sign in: is the database seeded (bun run drizzle:seed) and was the dev server started by Playwright (PLAYWRIGHT=true)?",
	).toHaveURL(/\/tasks$/);
	await expect(page.getByText("Tasks", { exact: true })).toBeVisible();

	// Kept for the member project's storageState; the auth itself is the header.
	await context.storageState({ path: "playwright/.auth/member.json" });
});
