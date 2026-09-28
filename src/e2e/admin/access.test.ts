import { expect, test } from "@playwright/test";
import { AdminTasksListPage } from "../pages/admin/tasks-list.page";

test.describe("Admin Access", () => {
	test("can access admin tasks page", async ({ page }) => {
		const tasksListPage = new AdminTasksListPage(page);
		await tasksListPage.goto();

		await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
		await expect(tasksListPage.getAddNewButton()).toBeVisible();
	});
});
