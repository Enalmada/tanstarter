import { expect, test } from "@playwright/test";

/**
 * Admin Users Tests
 *
 * Basic tests to verify admin access to user management.
 * Uses the authenticated state from admin.setup.ts.
 *
 * Testing strategy:
 * 1. Start with basic page access tests
 * 2. Verify only essential, always-present elements
 * 3. No data-dependent checks yet
 * 4. Fast checks using SSR content
 *
 * Future tests to add:
 * - User management operations
 * - Role management
 * - User search and filtering
 * - Pagination
 * - Error states
 */
test.describe("Admin Users", () => {
	// TODO consider using email login instead
	test.beforeEach(async ({ context }) => {
		// Set auth header for all requests in this test
		await context.setExtraHTTPHeaders({
			authorization: "playwright-admin-test-token",
		});
	});

	test("can access admin users page", async ({ page }) => {
		await page.goto("/admin/users");
		await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
	});
});
