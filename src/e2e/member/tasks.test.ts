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
	test("shows task list page elements", async ({ page }) => {
		const tasksListPage = new MemberTasksListPage(page);
		await tasksListPage.goto();

		// Check new task link exists
		await expect(tasksListPage.getNewTaskLink()).toBeVisible();

		// Check main content area exists
		await expect(tasksListPage.getMainContent()).toBeVisible();
	});

	// Specs share the seeded member and run in parallel, so each one works on
	// its own uniquely named task instead of asserting an empty list.
	test("creates, updates and deletes its own task", async ({ page }) => {
		const taskFormPage = new MemberTaskFormPage(page);
		const title = `E2E member task ${Date.now()}`;
		const taskLink = (text: string) => page.locator('a[href^="/tasks/tsk_"]', { hasText: text });

		await taskFormPage.goto();
		await taskFormPage.createTask({ title, description: "Created by e2e" });
		await expect(page.getByText("Task created successfully")).toBeVisible();
		await expect(taskLink(title)).toBeVisible();

		await taskLink(title).click();
		await page.waitForURL(/\/tasks\/tsk_/);
		const taskUrl = page.url();
		const updatedTitle = `${title} (updated)`;
		await taskFormPage.editTask({ title: updatedTitle });
		await expect(page.getByText("Task updated successfully")).toBeVisible();

		// Saving returns to the list, so reopen the task to delete it
		await page.goto(taskUrl);
		await page.waitForLoadState("networkidle");
		await taskFormPage.delete();
		await expect(page.getByText("Task deleted successfully")).toBeVisible();
		await page.waitForURL("/tasks");
		await expect(taskLink(updatedTitle)).toHaveCount(0);
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
