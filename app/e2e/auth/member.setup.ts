import { expect, test as setup } from "@playwright/test";

/**
 * Member Authentication Setup
 *
 * This test sets up the authenticated state for member tests.
 * It uses a special test token that is only valid in development mode.
 *
 * The auth flow:
 * 1. Set the test token in a cookie
 * 2. Navigate to a protected page
 * 3. Verify we can see member-specific content
 * 4. Save the authenticated state for other tests
 *
 * Key points:
 * - Fast verification using SSR page title
 * - No loading state checks needed
 * - Minimal timeout since page is server rendered
 * - Auth state is saved to member.json for reuse
 */
setup("authenticate as member", async ({ page }) => {
	// Start from home page
	await page.goto("/");

	// Set test token in cookie
	await page.context().addCookies([
		{
			name: "session",
			value: "playwright-test-token",
			domain: "localhost",
			path: "/",
		},
	]);

	// Navigate to tasks page and verify we can access it
	await page.goto("/tasks");
	await expect(page.getByText("Tasks", { exact: true })).toBeVisible();

	// Save signed-in state for other tests to use
	await page.context().storageState({
		path: "playwright/.auth/member.json",
	});
});
