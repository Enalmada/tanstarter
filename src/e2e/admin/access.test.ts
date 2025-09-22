import { expect, test } from "@playwright/test";

test.describe("Admin Access", () => {
	test.beforeEach(async ({ context }) => {
		// TODO consider using email login instead
		// Set auth header for all requests in this test
		await context.setExtraHTTPHeaders({
			authorization: "playwright-admin-test-token",
		});
	});

	test("can access admin tasks page", async ({ page }) => {
		await page.goto("/admin/tasks");
		await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
		await expect(page.getByRole("button", { name: /new/i })).toBeVisible();
	});
});
