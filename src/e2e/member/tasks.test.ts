import { expect, test } from "@playwright/test";
import { MemberTaskFormPage } from "../pages/member/task-form.page";
import { MemberTasksListPage } from "../pages/member/tasks-list.page";

/**
 * Member Tasks Tests
 *
 * Testing Strategy:
 * 1. Uses Page Object Model pattern for maintainability
 *    - Page objects encapsulate UI interactions
 *    - Tests focus on business logic and assertions
 *    - Resilient to UI changes
 * 2. Start with minimal, reliable checks
 *    - Focus on elements that must exist for basic functionality
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
		const tasksListPage = new MemberTasksListPage(page);
		await tasksListPage.goto();

		// Check new task link exists
		await expect(tasksListPage.getNewTaskLink()).toBeVisible();

		// Check main content area exists
		await expect(tasksListPage.getMainContent()).toBeVisible();
	});

	test("clears tasks and shows empty state", async ({ page }) => {
		const tasksListPage = new MemberTasksListPage(page);
		await tasksListPage.goto();

		// Check for empty state text
		await expect(tasksListPage.getEmptyStateText()).toBeVisible();
	});

	test("shows task form page", async ({ page }) => {
		const taskFormPage = new MemberTaskFormPage(page);
		await taskFormPage.goto();

		const fields = taskFormPage.getFormFields();

		// Check for form elements
		await expect(fields.title).toBeVisible();
		await expect(taskFormPage.getCreateButton()).toBeVisible();
	});

	test("shows all form fields", async ({ page }) => {
		const taskFormPage = new MemberTaskFormPage(page);
		await taskFormPage.goto();

		const fields = taskFormPage.getFormFields();

		// Check for required form fields
		await expect(fields.title).toBeVisible();
		await expect(fields.description).toBeVisible();
	});
});
