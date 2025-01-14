import type { Page } from "@playwright/test";

/**
 * Test Data Management
 *
 * Helpers to manage test data isolation without affecting dev environment.
 * Uses existing CRUD endpoints for data manipulation, with a development-only
 * endpoint for clearing test data.
 */

export async function clearTestTasks(page: Page) {
	// Development-only endpoint for clearing tasks
	await page.request.post("/api/test/clear-tasks");
}

export async function createTestTask(
	page: Page,
	task: {
		title: string;
		description?: string;
		dueDate?: string;
		status?: string;
	},
) {
	// Use existing CRUD endpoint
	await page.request.post("/api/tasks", { data: task });
}

export async function setupEmptyTaskList(page: Page) {
	await clearTestTasks(page);
}

export async function setupTaskListWithItems(page: Page) {
	await clearTestTasks(page);
	await createTestTask(page, {
		title: "Test Task 1",
		description: "Test Description",
	});
	await createTestTask(page, {
		title: "Test Task 2",
		description: "Another Test",
	});
}
