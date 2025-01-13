import { expect, test } from "@playwright/test";

/**
 * Task Management E2E Tests
 *
 * Tests the core task management functionality including:
 * - Task creation
 * - Task editing
 * - Task deletion
 * - Task filtering
 * - Task status updates
 */
test.describe("Task operations", () => {
	test.use({ storageState: "playwright/.auth/user.json" });

	test.beforeEach(async ({ page }) => {
		// Start each test from tasks page
		await page.goto("/tasks");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForLoadState("networkidle");

		// Wait for the loading skeleton to disappear
		await page.waitForSelector("[data-testid='task-list-skeleton']", {
			state: "detached",
			timeout: 10000,
		});
	});

	test("should show tasks page when authenticated", async ({ page }) => {
		// Verify we're on the tasks page
		expect(page.url()).toContain("/tasks");

		// Check for the Tasks heading
		await expect(page.getByText("Tasks", { exact: true })).toBeVisible({
			timeout: 10000,
		});
	});

	test("should handle task detail operations", async ({ page }) => {
		// Create a new task
		await page.getByRole("link", { name: /new task/i }).click();
		await page.getByLabel("Title").fill("Test Task");
		await page.getByLabel("Description").fill("Test Description");
		await page.getByRole("button", { name: /create/i }).click();

		// Verify task was created and appears in list
		await expect(page.getByText("Test Task")).toBeVisible();
		await expect(page.getByText("Test Description")).toBeVisible();

		// Edit the task
		await page.getByText("Test Task").click();
		await page.getByLabel("Title").fill("Updated Task");
		await page.getByLabel("Description").fill("Updated Description");
		await page.getByRole("button", { name: /save/i }).click();

		// Verify task was updated
		await expect(page.getByText("Updated Task")).toBeVisible();
		await expect(page.getByText("Updated Description")).toBeVisible();

		// Delete the task
		await page.getByText("Updated Task").click();
		await page.getByRole("button", { name: /delete/i }).click();

		// Verify task was deleted
		await expect(page.getByText("Updated Task")).not.toBeVisible();
	});

	test("should handle task list operations", async ({ page }) => {
		// Create two tasks
		await page.getByRole("link", { name: /new task/i }).click();
		await page.getByLabel("Title").fill("Task 1");
		await page.getByRole("button", { name: /create/i }).click();

		await page.getByRole("link", { name: /new task/i }).click();
		await page.getByLabel("Title").fill("Task 2");
		await page.getByRole("button", { name: /create/i }).click();

		// Mark Task 1 as completed
		await page
			.getByText("Task 1")
			.locator("..")
			.locator("..")
			.getByRole("checkbox")
			.check();

		// Filter by completed tasks
		await page.getByRole("button", { name: /completed/i }).click();
		await expect(page.getByText("Task 1")).toBeVisible();
		await expect(page.getByText("Task 2")).not.toBeVisible();

		// Filter by active tasks
		await page.getByRole("button", { name: /active/i }).click();
		await expect(page.getByText("Task 1")).not.toBeVisible();
		await expect(page.getByText("Task 2")).toBeVisible();

		// Delete both tasks
		await page.getByRole("button", { name: /all/i }).click();
		await page.getByText("Task 1").click();
		await page.getByRole("button", { name: /delete/i }).click();
		await page.getByText("Task 2").click();
		await page.getByRole("button", { name: /delete/i }).click();

		// Verify both tasks were deleted
		await expect(page.getByText("Task 1")).not.toBeVisible();
		await expect(page.getByText("Task 2")).not.toBeVisible();
	});
});
