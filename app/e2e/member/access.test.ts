import { expect, test } from "@playwright/test";

test.describe("Member Access", () => {
	test("can access tasks page", async ({ page }) => {
		await page.goto("/tasks");
		await expect(page.getByText("Tasks", { exact: true })).toBeVisible();
		await expect(page.getByRole("link", { name: /new task/i })).toBeVisible();
	});
});
