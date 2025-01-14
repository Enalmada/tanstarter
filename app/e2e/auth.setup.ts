import { test } from "@playwright/test";

test("authenticate", async ({ page }) => {
	// Set test token in cookie
	await page.context().addCookies([
		{
			name: "session",
			value: "playwright-test-token",
			domain: "localhost",
			path: "/",
		},
	]);

	// Navigate to tasks page to verify auth works
	await page.goto("/tasks");
	await page.waitForLoadState("domcontentloaded");
	await page.waitForLoadState("networkidle");

	// Save the authentication state
	await page.context().storageState({
		path: "playwright/.auth/user.json",
	});
});
