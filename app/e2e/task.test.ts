import { expect, test } from "@playwright/test";

test.describe.skip("Task operations", () => {
	test.use({ storageState: "playwright/.auth/user.json" });

	test("should handle task detail operations", async ({ page }) => {
		// Navigate to tasks page and wait for it to load
		await page.goto("/app/tasks");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForLoadState("networkidle");

		// Debug log current URL and page content
		// biome-ignore lint/suspicious/noConsoleLog: Temporary debug logging
		console.log("Current URL:", page.url());
		const content = await page.evaluate(
			() => document.documentElement.outerHTML,
		);
		// biome-ignore lint/suspicious/noConsoleLog: Temporary debug logging
		console.log("Page content:", content);

		// Wait for the Create Task button to be visible
		const createTaskButton = page.getByRole("button", { name: /create task/i });
		await expect(createTaskButton).toBeVisible({ timeout: 10000 });

		// Click the Create Task button
		await createTaskButton.click();

		// Fill out the task form
		await page.getByLabel("Title").fill("Test Task");
		await page.getByLabel("Description").fill("Test Description");
		await page.getByLabel("Due Date").fill("2024-12-31");

		// Click Create button
		await page.getByRole("button", { name: "Create" }).click();

		// Verify task was created
		await expect(page.getByText("Test Task")).toBeVisible();
		await expect(page.getByText("Test Description")).toBeVisible();
		await expect(page.getByText("Dec 31, 2024")).toBeVisible();

		// Edit the task
		await page.getByRole("link", { name: "Test Task" }).click();
		await page.getByLabel("Title").fill("Updated Task");
		await page.getByLabel("Description").fill("Updated Description");
		await page.getByLabel("Due Date").fill("2024-12-30");
		await page.getByRole("button", { name: "Edit" }).click();

		// Verify task was updated
		await expect(page.getByText("Updated Task")).toBeVisible();
		await expect(page.getByText("Updated Description")).toBeVisible();
		await expect(page.getByText("Dec 30, 2024")).toBeVisible();

		// Delete the task
		await page.getByRole("link", { name: "Updated Task" }).click();
		await page.getByRole("button", { name: "Delete" }).click();

		// Verify task was deleted
		await expect(page.getByText("Updated Task")).not.toBeVisible();
	});

	test("should handle task list operations", async ({ page }) => {
		// Navigate to tasks page
		await page.goto("/app/tasks");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForLoadState("networkidle");

		// Wait for the Create Task button to be visible
		const createTaskButton = page.getByRole("button", { name: /create task/i });
		await expect(createTaskButton).toBeVisible({ timeout: 10000 });

		// Create first task
		await createTaskButton.click();
		await page.getByLabel("Title").fill("Task 1");
		await page.getByLabel("Description").fill("Description 1");
		await page.getByLabel("Due Date").fill("2024-12-31");
		await page.getByRole("button", { name: "Create" }).click();

		// Create second task
		await createTaskButton.click();
		await page.getByLabel("Title").fill("Task 2");
		await page.getByLabel("Description").fill("Description 2");
		await page.getByLabel("Due Date").fill("2024-12-30");
		await page.getByRole("button", { name: "Create" }).click();

		// Verify both tasks are visible
		await expect(page.getByText("Task 1")).toBeVisible();
		await expect(page.getByText("Task 2")).toBeVisible();

		// Mark Task 1 as completed
		await page.getByRole("link", { name: "Task 1" }).click();
		await page.getByLabel("Status").selectOption("COMPLETED");
		await page.getByRole("button", { name: "Edit" }).click();

		// Filter by completed tasks
		await page
			.getByRole("combobox", { name: "Status" })
			.selectOption("COMPLETED");

		// Verify only Task 1 is visible
		await expect(page.getByText("Task 1")).toBeVisible();
		await expect(page.getByText("Task 2")).not.toBeVisible();

		// Delete both tasks
		await page.getByRole("link", { name: "Task 1" }).click();
		await page.getByRole("button", { name: "Delete" }).click();

		// Reset filter
		await page.getByRole("combobox", { name: "Status" }).selectOption("ALL");

		await page.getByRole("link", { name: "Task 2" }).click();
		await page.getByRole("button", { name: "Delete" }).click();

		// Verify both tasks are deleted
		await expect(page.getByText("Task 1")).not.toBeVisible();
		await expect(page.getByText("Task 2")).not.toBeVisible();
	});
});
