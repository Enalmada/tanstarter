import { expect, test } from "@playwright/test";

/**
 * Admin Authentication Setup
 *
 * This test sets up the authenticated state for admin tests.
 * It uses a special test token that is only valid in development mode.
 */
test("authenticate as admin", async ({ page, context }) => {
	// Set auth header for all requests
	const headers = {
		authorization: "playwright-admin-test-token",
	};
	await context.setExtraHTTPHeaders(headers);

	// Navigate to admin page
	await page.goto("/admin");
	await expect(page.getByText("Admin Dashboard", { exact: true })).toBeVisible();

	// Save signed-in state for other tests to use
	await context.storageState({ path: "playwright/.auth/admin.json" });
});
