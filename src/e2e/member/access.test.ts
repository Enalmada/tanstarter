import { expect, test } from "@playwright/test";
import { MemberTasksListPage } from "../pages/member/tasks-list.page";

test.describe("Member Access", () => {
	test("can access tasks page", async ({ page }) => {
		const tasksListPage = new MemberTasksListPage(page);
		await tasksListPage.goto();

		await expect(page.getByText("Tasks", { exact: true })).toBeVisible();
		await expect(tasksListPage.getNewTaskLink()).toBeVisible();
	});

	test("is sent to the task list with a notice when opening the admin area", async ({ page }) => {
		await page.goto("/admin");
		await expect(page).toHaveURL(/\/tasks\?error=/);
		await page.goto("/debug/monitoring");
		await expect(page).toHaveURL(/\/tasks\?error=/);
	});

	test("is sent away from the sign-in page", async ({ page }) => {
		await page.goto("/signin");
		await expect(page).toHaveURL(/\/tasks$/);
	});
});
