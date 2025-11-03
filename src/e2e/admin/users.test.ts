import { expect, test } from "@playwright/test";
import { AdminUsersPage } from "../pages/admin/users.page";

/**
 * Admin Users Tests
 *
 * Basic tests to verify admin access to user management.
 * Uses Page Object Model pattern for maintainability.
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
		const usersPage = new AdminUsersPage(page);
		await usersPage.goto();

		await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
	});
});
