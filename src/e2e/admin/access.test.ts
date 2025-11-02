import { expect, test } from "@playwright/test";
import { AdminTasksListPage } from "../pages/admin/tasks-list.page";

test.describe("Admin Access", () => {
	test.beforeEach(async ({ context }) => {
		// TODO consider using email login instead
		// Set auth header for all requests in this test
		await context.setExtraHTTPHeaders({
			authorization: "playwright-admin-test-token",
		});
	});

	test("can access admin tasks page", async ({ page }) => {
		const tasksListPage = new AdminTasksListPage(page);
		await tasksListPage.goto();

		await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
		await expect(tasksListPage.getAddNewButton()).toBeVisible();
	});
});
