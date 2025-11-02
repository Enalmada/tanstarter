import { expect, test } from "@playwright/test";
import { AdminTaskFormPage } from "../pages/admin/task-form.page";
import { AdminTasksListPage } from "../pages/admin/tasks-list.page";

/**
 * Admin Tasks Tests
 *
 * Testing Strategy:
 * 1. Uses Page Object Model pattern for maintainability
 *    - Page objects encapsulate UI interactions
 *    - Tests focus on business logic and assertions
 *    - Resilient to UI changes
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
		const tasksListPage = new AdminTasksListPage(page);
		await tasksListPage.goto();

		// Check new task button exists
		await expect(tasksListPage.getAddNewButton()).toBeVisible();

		// Check main content area exists
		await expect(tasksListPage.getMainContent()).toBeVisible();
	});

	// TODO: Implement empty state UI and enable this test
	// test("shows empty state", async ({ page }) => {
	// 	const tasksListPage = new AdminTasksListPage(page);
	// 	await tasksListPage.goto();
	// 	await setupEmptyTaskList(page);
	// 	await page.reload();
	//
	// 	// Should show empty state - update text once UI is implemented
	// 	await expect(page.getByText(/no tasks found/i)).toBeVisible();
	// });

	test("shows table structure", async ({ page }) => {
		const tasksListPage = new AdminTasksListPage(page);
		await tasksListPage.goto();

		const columns = tasksListPage.getTableColumns();

		// Check for column headers - using exact text from screenshot
		await expect(columns.title).toBeVisible();
		await expect(columns.status).toBeVisible();
		await expect(columns.dueDate).toBeVisible();
		await expect(columns.created).toBeVisible();
		await expect(columns.lastUpdated).toBeVisible();
	});

	test("shows admin task form page", async ({ page }) => {
		const taskFormPage = new AdminTaskFormPage(page);
		await taskFormPage.goto();

		const fields = taskFormPage.getFormFields();

		// Check for form elements
		await expect(fields.title).toBeVisible();
		await expect(taskFormPage.getSubmitButton()).toBeVisible();
	});

	test("shows all form fields", async ({ page }) => {
		const taskFormPage = new AdminTaskFormPage(page);
		await taskFormPage.goto();

		const fields = taskFormPage.getFormFields();

		// Check for required form fields
		await expect(fields.title).toBeVisible();
		await expect(fields.description).toBeVisible();
		await expect(fields.dueDate).toBeVisible();
		await expect(fields.status).toBeVisible();
	});
});
