import { expect, test } from "@playwright/test";
import { MarketingPage } from "../pages/public/marketing.page";

/**
 * Marketing Page E2E Tests
 *
 * Tests the public marketing pages and their navigation flows.
 * Uses Page Object Model pattern for maintainability.
 * Focus on critical user paths and content visibility.
 */
test.describe("Marketing pages", () => {
	test.beforeEach(async ({ page }) => {
		const marketingPage = new MarketingPage(page);
		await marketingPage.goto();
		await marketingPage.waitForPageLoad();
	});

	test("home page loads successfully", async ({ page }) => {
		const marketingPage = new MarketingPage(page);

		// Wait for critical UI elements with extended timeout
		await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

		// Core content verification
		await expect(page).toHaveTitle(/TanStarter/);

		// Critical UI elements
		await expect(marketingPage.getMainHeading()).toBeVisible();
		await expect(marketingPage.getMarketingText()).toBeVisible();
		await expect(marketingPage.getGetStartedLink()).toBeVisible();
		await expect(marketingPage.getGithubLink()).toBeVisible();
		await expect(marketingPage.getFeaturesHeading()).toBeVisible();
	});

	test("navigation to app works", async ({ page }) => {
		const marketingPage = new MarketingPage(page);

		// Act: Click the Get Started button
		await marketingPage.clickGetStarted();

		// Assert: Verify we're no longer on the marketing page
		await expect(marketingPage.getMainHeading()).not.toBeVisible();
	});
});
