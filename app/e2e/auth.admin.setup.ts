import { test as setup } from "@playwright/test";

setup("authenticate as admin", async ({ page }) => {
	// Set cookie with test token
	await page.context().addCookies([
		{
			name: "session",
			value: "playwright-admin-test-token",
			domain: "localhost",
			path: "/",
		},
	]);

	// Navigate to tasks page to verify auth works
	await page.goto("/admin/tasks");

	// Save signed-in state
	await page.context().storageState({
		path: "playwright/.auth/admin.json",
	});
});
