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

	// Encoded separators must stay on this origin (server redirect on load, and the client router)
	for (const target of [
		"/%2f%2fevil.test",
		"/%2F/evil.test",
		"/%5cevil.test",
		"/%09/evil.test",
		"/..%2f..%2fevil.test",
	]) {
		test(`keeps ?redirect=${target} on this origin`, async ({ page }) => {
			await page.goto(`/signin?redirect=${encodeURIComponent(target)}`);
			await page.waitForLoadState("networkidle");
			expect(new URL(page.url()).origin).toBe("http://localhost:3000");
		});
	}
});
