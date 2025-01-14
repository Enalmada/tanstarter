import { test as setup } from "@playwright/test";

setup("authenticate as user", async ({ page }) => {
	await page.goto("/");
	await page.context().addCookies([
		{
			name: "session",
			value: "playwright-test-token",
			domain: "localhost",
			path: "/",
		},
	]);
	await page.goto("/tasks");
	await page.waitForURL("/tasks");
	await page.context().storageState({
		path: "playwright/.auth/user.json",
	});
});
