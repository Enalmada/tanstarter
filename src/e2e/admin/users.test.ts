import { expect, test } from "@playwright/test";
import { PLAYWRIGHT_MEMBER_USER } from "~/utils/test/playwright-users";
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
 * 3. Data checks use the seeded Playwright member only
 * 4. Fast checks using SSR content
 *
 * Future tests to add:
 * - Role management
 * - User search and filtering
 * - Pagination
 * - Error states
 */
test.describe("Admin Users", () => {
	test("can access admin users page", async ({ page }) => {
		const usersPage = new AdminUsersPage(page);
		await usersPage.goto();

		await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
	});

	test("edits a user's name", async ({ page }) => {
		const usersPage = new AdminUsersPage(page);
		const nameInput = page.getByPlaceholder("Enter user name");
		const rename = async (name: string) => {
			await usersPage.goto();
			await page.getByRole("cell", { name: PLAYWRIGHT_MEMBER_USER.email }).click();
			await page.waitForURL(/\/admin\/users\/usr_/);
			await nameInput.fill(name);
			await page.locator("button[type=submit]").click();
			await expect(page.getByText("User updated successfully").first()).toBeVisible();
		};

		await rename(`E2E Member ${Date.now()}`);
		// Put the seeded name back
		await rename(PLAYWRIGHT_MEMBER_USER.name);
	});
});
