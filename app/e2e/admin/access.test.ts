import { expect, test } from "@playwright/test";

test.describe("Admin Access", () => {
	test("can access admin tasks page", async ({ page }) => {
		await page.goto("/admin/tasks");
		await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
		await expect(page.getByRole("button", { name: /new/i })).toBeVisible();
	});
});
