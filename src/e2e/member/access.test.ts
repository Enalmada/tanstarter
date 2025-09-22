import { expect, test } from "@playwright/test";

test.describe("Member Access", () => {
	// TODO consider using email login instead
	test.beforeEach(async ({ context }) => {
		// Set auth header for all requests in this test
		await context.setExtraHTTPHeaders({
			authorization: "playwright-test-token",
		});
	});

	test("can access tasks page", async ({ page }) => {
		await page.goto("/tasks");
		await expect(page.getByText("Tasks", { exact: true })).toBeVisible();
		await expect(page.getByRole("link", { name: /new task/i })).toBeVisible();
	});
});
