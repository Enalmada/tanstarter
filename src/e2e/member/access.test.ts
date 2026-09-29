import { expect, test } from "@playwright/test";
import { MemberTasksListPage } from "../pages/member/tasks-list.page";

test.describe("Member Access", () => {
	test("can access tasks page", async ({ page }) => {
		const tasksListPage = new MemberTasksListPage(page);
		await tasksListPage.goto();

		await expect(page.getByText("Tasks", { exact: true })).toBeVisible();
		await expect(tasksListPage.getNewTaskLink()).toBeVisible();
	});
});
