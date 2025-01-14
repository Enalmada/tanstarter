import { expect, test } from "@playwright/test";

test.describe("Admin User operations", () => {
	// Use admin auth state for all tests in this file
	test.use({ storageState: "playwright/.auth/admin.json" });

	test.beforeEach(async ({ page }) => {
		// Start each test from admin users page
		await page.goto("/admin/users");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForLoadState("networkidle");

		// Wait for loading spinner to disappear
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});
	});

	test("should show admin users page when authenticated", async ({ page }) => {
		// Verify we're on the admin users page
		expect(page.url()).toContain("/admin/users");

		// Check for the Users heading
		await expect(
			page.getByRole("heading", { name: "Users", level: 1 }),
		).toBeVisible({ timeout: 5000 });

		// Check table headers
		await expect(page.locator("th", { hasText: "Email" })).toBeVisible({
			timeout: 5000,
		});
		await expect(page.locator("th", { hasText: "Role" })).toBeVisible({
			timeout: 5000,
		});
		await expect(page.locator("th", { hasText: "Created" })).toBeVisible({
			timeout: 5000,
		});
		await expect(page.locator("th", { hasText: "Last Updated" })).toBeVisible({
			timeout: 5000,
		});
	});

	test("should handle admin user operations", async ({ page }) => {
		// Find and click on test user by email
		const userRow = page.locator("td", { hasText: "test@example.com" });
		await expect(userRow).toBeVisible({ timeout: 5000 });
		await userRow.click();
		await page.waitForURL(/\/admin\/users\/[^/]+$/);
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});

		// Wait for form to be visible and interactive
		const form = page.locator("form");
		await expect(form).toBeVisible({ timeout: 5000 });

		// Update user name
		const nameInput = page.getByPlaceholder("Enter user name");
		await expect(nameInput).toBeVisible({ timeout: 5000 });
		await nameInput.fill("Updated Test User");

		const updateButton = page.getByRole("button", { name: "Update User" });
		await expect(updateButton).toBeVisible({ timeout: 5000 });
		await updateButton.click();
		await page.waitForLoadState("networkidle");

		// Verify update
		await expect(page.getByText("Updated Test User")).toBeVisible({
			timeout: 5000,
		});

		// Revert user name
		await nameInput.fill("Test User");
		await updateButton.click();
		await page.waitForLoadState("networkidle");

		// Verify revert
		await expect(page.getByText("Test User")).toBeVisible({ timeout: 5000 });
	});
});
