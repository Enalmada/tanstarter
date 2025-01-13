import { expect, test as setup } from "@playwright/test";

setup("authenticate as admin", async ({ page }) => {
	// Start from home page
	await page.goto("/");

	// Set admin test token in cookie
	await page.context().addCookies([
		{
			name: "session",
			value: "playwright-admin-test-token",
			domain: "localhost",
			path: "/",
		},
	]);

	// Navigate to admin page and verify we can access it
	await page.goto("/admin/tasks");
	await page.waitForURL("/admin/tasks");

	// Basic check that we're logged in as admin
	await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible({
		timeout: 30000,
	});

	// Save signed-in state
	await page.context().storageState({
		path: "playwright/.auth/admin.json",
	});
});
