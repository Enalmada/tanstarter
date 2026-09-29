import { expect, test } from "@playwright/test";
import { PLAYWRIGHT_ADMIN_USER } from "~/utils/test/playwright-users";
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

	test("creates, updates and deletes a task", async ({ page }) => {
		const taskFormPage = new AdminTaskFormPage(page);
		const title = `E2E admin task ${Date.now()}`;
		const updatedTitle = `${title} (updated)`;
		const row = (text: string) => page.getByRole("row", { name: text });

		// The admin form sets the owner explicitly; use the seeded admin's id
		await page.goto("/admin/users");
		await page.waitForLoadState("networkidle");
		await page.getByRole("cell", { name: PLAYWRIGHT_ADMIN_USER.email }).click();
		await page.waitForURL(/\/admin\/users\/usr_/);
		const adminId = new URL(page.url()).pathname.split("/").pop() ?? "";

		await taskFormPage.gotoAndWaitForReady();
		await page.getByLabel("User ID").fill(adminId);
		await taskFormPage.createTask({ title, description: "Created by e2e" });
		await expect(page.getByText("Task created successfully")).toBeVisible();
		await taskFormPage.waitForUrl("/admin/tasks");

		await row(title).click();
		await taskFormPage.waitForUrl(/\/admin\/tasks\/tsk_/);
		const taskUrl = page.url();
		await taskFormPage.waitForFormReady();
		expect(await taskFormPage.getTitleValue()).toBe(title);

		await taskFormPage.editTask({ title: updatedTitle });
		await expect(page.getByText("Task updated successfully")).toBeVisible();

		// Saving returns to the list, so reopen the task to delete it
		await page.goto(taskUrl);
		await page.waitForLoadState("networkidle");
		await taskFormPage.delete();
		await expect(page.getByText("Task deleted successfully")).toBeVisible();
		await expect(row(updatedTitle)).toHaveCount(0);
	});
});
