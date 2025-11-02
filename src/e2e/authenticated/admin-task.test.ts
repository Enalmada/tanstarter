import { expect, test } from "@playwright/test";
import { AdminTaskFormPage } from "../pages/admin/task-form.page";
import { AdminTasksListPage } from "../pages/admin/tasks-list.page";

/**
 * Admin Tasks Integration Tests
 *
 * Tests complete CRUD workflows using Page Object Model pattern.
 * Demonstrates best practices for:
 * - Page Object usage in integration tests
 * - Complex multi-step workflows
 * - Data verification across pages
 * - Clean test isolation (create → use → cleanup)
 */
test.describe("Admin Tasks Integration", () => {
	// Use admin auth state for all tests in this file
	test.use({ storageState: "playwright/.auth/admin.json" });

	test.beforeEach(async ({ page }) => {
		const tasksListPage = new AdminTasksListPage(page);
		await tasksListPage.gotoAndWaitForReady();
	});

	test("should show admin tasks page with correct table structure", async ({ page }) => {
		const tasksListPage = new AdminTasksListPage(page);

		// Verify we're on the admin tasks page
		expect(tasksListPage.isOnPage("/admin/tasks")).toBe(true);

		// Verify page title
		await expect(page.getByRole("heading", { name: "Tasks", level: 1 })).toBeVisible();

		// Verify table columns
		const columns = tasksListPage.getTableColumns();
		await expect(columns.title).toBeVisible();
		await expect(columns.status).toBeVisible();
		await expect(columns.dueDate).toBeVisible();
		await expect(columns.created).toBeVisible();
		await expect(columns.lastUpdated).toBeVisible();

		// Verify Add New button is present
		await expect(tasksListPage.getAddNewButton()).toBeVisible();
	});

	test("should handle complete task CRUD workflow", async ({ page }) => {
		const tasksListPage = new AdminTasksListPage(page);
		const taskFormPage = new AdminTaskFormPage(page);

		// Navigate to new task form
		await tasksListPage.clickAddNew();
		await taskFormPage.waitForUrl("/admin/tasks/new");
		await taskFormPage.waitForFormReady();

		// Create task with unique title
		const testTitle = `Test Task ${Date.now()}`;
		await taskFormPage.createTaskByPlaceholder({
			title: testTitle,
			description: "Test Description",
		});

		// Verify redirect to detail page
		expect(taskFormPage.isOnPage(/^\/admin\/tasks\/[^/]+$/)).toBe(true);
		await taskFormPage.waitForFormReady();

		// Verify task was created
		const createdTitle = await taskFormPage.getTitleValue();
		expect(createdTitle).toBe(testTitle);

		// Edit task
		const updatedTitle = `Updated ${testTitle}`;
		await taskFormPage.editTask({ title: updatedTitle });
		await taskFormPage.waitForPageLoad();

		// Verify update
		const titleAfterUpdate = await taskFormPage.getTitleValue();
		expect(titleAfterUpdate).toBe(updatedTitle);

		// Delete task
		await taskFormPage.delete();
		await taskFormPage.waitForUrl("/admin/tasks");
		await taskFormPage.waitForPageLoad();

		// Verify back on list page
		expect(tasksListPage.isOnPage("/admin/tasks")).toBe(true);
	});

	test("should navigate to task details when clicking row", async ({ page }) => {
		const tasksListPage = new AdminTasksListPage(page);
		const taskFormPage = new AdminTaskFormPage(page);

		// Create a task first
		await tasksListPage.clickAddNew();
		await taskFormPage.waitForUrl("/admin/tasks/new");
		await taskFormPage.waitForFormReady();

		const testTitle = `Navigation Test Task ${Date.now()}`;
		await taskFormPage.createTaskByPlaceholder({ title: testTitle });

		// Wait for redirect to detail page
		await taskFormPage.waitForUrl(/^\/admin\/tasks\/[^/]+$/);
		await taskFormPage.waitForFormReady();

		// Go back to list
		await tasksListPage.gotoAndWaitForReady();

		// Find and click the task row
		const taskRow = page.getByText(testTitle);
		await expect(taskRow).toBeVisible();
		await taskRow.click();

		// Verify navigated to details page
		await taskFormPage.waitForUrl(/^\/admin\/tasks\/[^/]+$/);
		await taskFormPage.waitForFormReady();

		const titleValue = await taskFormPage.getTitleValue();
		expect(titleValue).toBe(testTitle);

		// Clean up - delete the task
		await taskFormPage.delete();
		await tasksListPage.waitForUrl("/admin/tasks");
	});
});
