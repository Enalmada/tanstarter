import { expect, test } from "@playwright/test";
import { MemberTasksListPage } from "../pages/member/tasks-list.page";

test.describe("Member Access", () => {
	// TODO consider using email login instead
	test.beforeEach(async ({ context }) => {
		// Set auth header for all requests in this test
		await context.setExtraHTTPHeaders({
			authorization: "playwright-test-token",
		});
	});

	test("can access tasks page", async ({ page }) => {
		const tasksListPage = new MemberTasksListPage(page);
		await tasksListPage.goto();

		await expect(page.getByText("Tasks", { exact: true })).toBeVisible();
		await expect(tasksListPage.getNewTaskLink()).toBeVisible();
	});
});
