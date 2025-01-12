import { expect, test } from "@playwright/test";

/**
 * Marketing Page E2E Tests
 *
 * Tests the public marketing pages and their navigation flows.
 * Focus on critical user paths and content visibility.
 */
test.describe("Marketing pages", () => {
	test.beforeEach(async ({ page }) => {
		// Start each test from home page
		await page.goto("/");

		// Ensure page is fully loaded including dynamic content
		await page.waitForLoadState("networkidle");
	});

	test("home page loads successfully", async ({ page }) => {
		// Wait for critical UI elements with extended timeout
		await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

		// Core content verification
		await expect(page).toHaveTitle(/TanStarter/);

		// Critical UI elements - Main heading
		const heading = page.getByRole("heading", {
			name: /TanStarter/i,
			level: 1,
		});
		await expect(heading).toBeVisible();

		// Marketing copy
		const marketingText = page.getByText(/A modern, type-safe/i);
		await expect(marketingText).toBeVisible();

		// Important action buttons
		const getStartedButton = page.getByRole("link", {
			name: /Get Started/i,
		});
		const githubButton = page.getByRole("link", {
			name: /View on GitHub/i,
		});

		// Verify critical UI elements are visible
		await expect(getStartedButton).toBeVisible();
		await expect(githubButton).toBeVisible();

		// Features section should be present
		const featuresHeading = page.getByRole("heading", { name: /Features/i });
		await expect(featuresHeading).toBeVisible();
	});

	test("navigation to app works", async ({ page }) => {
		// Arrange: Find the Get Started button
		const getStartedLink = page.getByRole("link", {
			name: /Get Started/i,
		});

		// Act: Click the button and wait for navigation
		await getStartedLink.click();
		await page.waitForLoadState("networkidle");

		// Assert: Verify we're no longer on the marketing page
		const marketingHeading = page.getByRole("heading", {
			name: /TanStarter/i,
			level: 1,
		});
		await expect(marketingHeading).not.toBeVisible();
	});
});
