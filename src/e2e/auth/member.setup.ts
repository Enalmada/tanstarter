import { expect, test as setup } from "@playwright/test";

/**
 * Member Authentication Setup
 *
 * This test sets up the authenticated state for member tests.
 * It uses a special test token that is only valid in development mode.
 */
setup("authenticate as member", async ({ page, context }) => {
	// Set auth header for all requests
	const headers = {
		authorization: "playwright-test-token",
	};
	await context.setExtraHTTPHeaders(headers);

	// Navigate to tasks page and verify we can access it
	await page.goto("/tasks");
	await expect(page.getByText("Tasks", { exact: true })).toBeVisible();

	// Save signed-in state for other tests to use
	await page.context().storageState({
		path: "playwright/.auth/member.json",
	});
});
