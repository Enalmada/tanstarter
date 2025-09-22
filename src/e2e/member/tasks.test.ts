import { expect, test } from "@playwright/test";

/**
 * Member Tasks Tests
 *
 * Testing Strategy:
 * 1. Start with minimal, reliable checks
 *    - Focus on elements that must exist for basic functionality
 *    - Avoid assumptions about exact text/headings
 *    - Use role-based selectors when possible
 */
test.describe("Member Tasks", () => {
	test.beforeEach(async ({ context }) => {
		// Set auth header for all requests in this test
		await context.setExtraHTTPHeaders({
			authorization: "playwright-test-token",
		});
	});

	test("shows task list page elements", async ({ page }) => {
		await page.goto("/tasks");

		// Check new task link exists
		await expect(page.getByRole("link", { name: /new/i })).toBeVisible();

		// Check main content area exists
		await expect(page.getByRole("main")).toBeVisible();
	});

	test("clears tasks and shows empty state", async ({ page }) => {
		await page.goto("/tasks");

		// Check for empty state text
		const emptyStatePatterns = [/no tasks/i, /create.*first task/i, /get started/i, /nothing here/i, /empty/i];

		const emptyText = page.getByText(new RegExp(emptyStatePatterns.map((p) => p.source).join("|"), "i"));
		await expect(emptyText).toBeVisible();
	});

	test("shows task form page", async ({ page }) => {
		await page.goto("/tasks/new");

		// Check for form elements
		await expect(page.getByLabel("Title")).toBeVisible();
		await expect(page.getByRole("button", { name: /create task/i })).toBeVisible();
	});

	test("shows all form fields", async ({ page }) => {
		await page.goto("/tasks/new");

		// Check for required form fields
		await expect(page.getByLabel("Title")).toBeVisible();
		await expect(page.getByLabel("Description")).toBeVisible();
	});
});
