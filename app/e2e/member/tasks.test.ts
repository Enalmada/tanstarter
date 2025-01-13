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
	test("shows task list page elements", async ({ page }) => {
		await page.goto("/tasks");

		// Check new task link exists
		await expect(page.getByRole("link", { name: /new/i })).toBeVisible();

		// Check main content area exists
		await expect(page.getByRole("main")).toBeVisible();
	});

	test("clears tasks and shows empty state", async ({ page }) => {
		await page.goto("/tasks");

		// Try to clear tasks and verify response
		const response = await page.request.post("/api/test/clear-tasks");
		expect(
			response.status(),
			`Clear tasks failed with status ${response.status()}: ${
				response.statusText() || "No status text"
			}`,
		).toBe(200);

		// Reload after clearing
		await page.reload();

		// Check for any empty state message - using common patterns
		const emptyStatePatterns = [
			/no tasks/i,
			/create.*first task/i,
			/get started/i,
			/nothing here/i,
			/empty/i,
		];

		// Try each pattern until we find a match
		const emptyText = page.getByText(
			new RegExp(emptyStatePatterns.map((p) => p.source).join("|"), "i"),
		);
		await expect(emptyText).toBeVisible();
	});

	test("shows task form page", async ({ page }) => {
		await page.goto("/tasks/new");

		// Check for form elements
		await expect(page.getByLabel("Title")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /create task/i }),
		).toBeVisible();
	});

	test("shows all form fields", async ({ page }) => {
		await page.goto("/tasks/new");

		// Check for required form fields
		await expect(page.getByLabel("Title")).toBeVisible();
		await expect(page.getByLabel("Description")).toBeVisible();
	});
});
