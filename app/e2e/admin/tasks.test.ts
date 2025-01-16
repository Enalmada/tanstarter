import { expect, test } from "@playwright/test";

/**
 * Admin Tasks Tests
 *
 * Testing Strategy:
 * 1. Start with minimal, reliable checks
 *    - Focus on elements that must exist for basic functionality
 *    - Avoid assumptions about exact text/headings
 *    - Use role-based selectors when possible
 *
 * 2. Current Tests:
 *    - List page: New task button and main content area
 *    - Form page: Title input and create button
 *    - Table structure and headers
 *    - Form fields (title, description)
 *
 * 3. Next Test Increments (in order):
 *    a. Static UI Elements
 *       - Check for action buttons (edit, delete)
 *       - Implement and test empty state UI
 *
 *    b. Table Structure
 *       - Confirm row structure
 *
 *    c. Basic Form Validation
 *       - Submit button state
 *       - Required field indicators
 *
 * Notes:
 * - Admin UI uses buttons vs links for actions
 * - Table structure differs from member view
 * - More form fields may be present in admin
 * - Focus on admin-specific functionality
 * - Check for proper role-based access control elements
 * - Tests use isolated test data via test-specific API endpoints
 */
test.describe("Admin Tasks", () => {
	// TODO consider using email login instead
	test.beforeEach(async ({ context }) => {
		// Set auth header for all requests in this test
		await context.setExtraHTTPHeaders({
			authorization: "playwright-admin-test-token",
		});
	});

	test("shows admin task list page elements", async ({ page }) => {
		await page.goto("/admin/tasks");

		// Check new task button exists
		await expect(page.getByRole("button", { name: "Add New" })).toBeVisible();

		// Check main content area exists
		await expect(page.getByRole("main")).toBeVisible();
	});

	// TODO: Implement empty state UI and enable this test
	// test("shows empty state", async ({ page }) => {
	// 	await page.goto("/admin/tasks");
	// 	await setupEmptyTaskList(page);
	// 	await page.reload();
	//
	// 	// Should show empty state - update text once UI is implemented
	// 	await expect(page.getByText(/no tasks found/i)).toBeVisible();
	// });

	test("shows table structure", async ({ page }) => {
		await page.goto("/admin/tasks");

		// Check for column headers - using exact text from screenshot
		await expect(page.getByRole("cell", { name: "Title" })).toBeVisible();
		await expect(page.getByRole("cell", { name: "Status" })).toBeVisible();
		await expect(page.getByRole("cell", { name: "Due Date" })).toBeVisible();
		await expect(page.getByRole("cell", { name: "Created" })).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "Last Updated" }),
		).toBeVisible();
	});

	test("shows admin task form page", async ({ page }) => {
		await page.goto("/admin/tasks/new");

		// Check for form elements
		await expect(page.getByLabel("Title")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /create task/i }),
		).toBeVisible();
	});

	test("shows all form fields", async ({ page }) => {
		await page.goto("/admin/tasks/new");

		// Check for required form fields
		await expect(page.getByLabel("Title")).toBeVisible();
		await expect(page.getByLabel("Description")).toBeVisible();
		await expect(page.getByLabel(/due date/i)).toBeVisible();
		await expect(page.getByLabel(/status/i)).toBeVisible();
	});
});
