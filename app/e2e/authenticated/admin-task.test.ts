import { expect, test } from "@playwright/test";

test.describe("Admin Tasks Page", () => {
	// Use admin auth state for all tests in this file
	test.use({ storageState: "playwright/.auth/admin.json" });

	test.beforeEach(async ({ page }) => {
		// Start each test from admin tasks page
		await page.goto("/admin/tasks");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForLoadState("networkidle");

		// Wait for loading spinner to disappear
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});
	});

	test("should show admin tasks page with correct table structure", async ({
		page,
	}) => {
		// Verify we're on the admin tasks page
		expect(page.url()).toContain("/admin/tasks");

		// Verify page title
		await expect(
			page.getByRole("heading", { name: "Tasks", level: 1 }),
		).toBeVisible({ timeout: 5000 });

		// Verify table headers using th elements
		const expectedHeaders = [
			"Title",
			"Status",
			"Due Date",
			"Created",
			"Last Updated",
		];
		for (const header of expectedHeaders) {
			await expect(page.locator("th", { hasText: header })).toBeVisible({
				timeout: 5000,
			});
		}

		// Verify Add New button is present
		await expect(page.getByRole("button", { name: "Add New" })).toBeVisible({
			timeout: 5000,
		});
	});

	test("should handle task creation and editing flow", async ({ page }) => {
		// Create new task
		const addButton = page.getByRole("button", { name: "Add New" });
		await expect(addButton).toBeVisible({ timeout: 5000 });
		await addButton.click();
		await page.waitForURL("/admin/tasks/new");
		await page.waitForLoadState("networkidle");

		// Wait for loading spinner to disappear
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});

		// Wait for form to be visible
		const form = page.locator("form");
		await expect(form).toBeVisible({ timeout: 5000 });

		// Get form inputs
		const titleInput = page.getByPlaceholder("Enter task title");
		const descInput = page.getByPlaceholder("Enter task description");
		await expect(titleInput).toBeVisible({ timeout: 5000 });
		await expect(descInput).toBeVisible({ timeout: 5000 });

		// Fill out task form
		const testTitle = `Test Task ${Date.now()}`;
		await titleInput.fill(testTitle);
		await descInput.fill("Test Description");

		const createButton = page.getByRole("button", { name: "Create Task" });
		await expect(createButton).toBeVisible({ timeout: 5000 });
		await createButton.click();

		// Wait for redirect and verify task was created
		await page.waitForURL(/^\/admin\/tasks\/[^/]+$/);
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});

		await expect(titleInput).toBeVisible({ timeout: 5000 });
		await expect(titleInput).toHaveValue(testTitle);

		// Edit task
		const updatedTitle = `Updated ${testTitle}`;
		await titleInput.fill(updatedTitle);

		const updateButton = page.getByRole("button", { name: "Update Task" });
		await expect(updateButton).toBeVisible({ timeout: 5000 });
		await updateButton.click();
		await page.waitForLoadState("networkidle");

		// Verify update
		await expect(titleInput).toHaveValue(updatedTitle);

		// Delete task
		const deleteButton = page.getByRole("button", { name: "Delete Task" });
		await expect(deleteButton).toBeVisible({ timeout: 5000 });
		await deleteButton.click();
		await page.waitForURL("/admin/tasks");
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});

		// Verify back on list page
		await expect(
			page.getByRole("heading", { name: "Tasks", level: 1 }),
		).toBeVisible({ timeout: 5000 });
	});

	test("should navigate to task details when clicking row", async ({
		page,
	}) => {
		// Create a task first
		await page.getByRole("button", { name: "Add New" }).click();
		await page.waitForURL("/admin/tasks/new");
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});

		// Wait for form and fill it
		const form = page.locator("form");
		await expect(form).toBeVisible({ timeout: 5000 });

		const titleInput = page.getByPlaceholder("Enter task title");
		await expect(titleInput).toBeVisible({ timeout: 5000 });

		const testTitle = `Navigation Test Task ${Date.now()}`;
		await titleInput.fill(testTitle);

		const createButton = page.getByRole("button", { name: "Create Task" });
		await expect(createButton).toBeVisible({ timeout: 5000 });
		await createButton.click();

		// Wait for redirect
		await page.waitForURL(/^\/admin\/tasks\/[^/]+$/);
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});

		// Go back to list
		await page.goto("/admin/tasks");
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});

		// Find and click the task row
		const taskRow = page.getByText(testTitle);
		await expect(taskRow).toBeVisible({ timeout: 5000 });
		await taskRow.click();
		await page.waitForURL(/^\/admin\/tasks\/[^/]+$/);
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});

		// Verify on details page
		await expect(titleInput).toBeVisible({ timeout: 5000 });
		await expect(titleInput).toHaveValue(testTitle);

		// Clean up - delete the task
		const deleteButton = page.getByRole("button", { name: "Delete Task" });
		await expect(deleteButton).toBeVisible({ timeout: 5000 });
		await deleteButton.click();
		await page.waitForURL("/admin/tasks");
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("[role='progressbar']", {
			state: "detached",
			timeout: 5000,
		});
	});
});
