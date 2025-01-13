import { test } from "@playwright/test";

test("authenticate", async ({ page }) => {
	// Navigate to tasks page and wait for it to load
	await page.goto("/app/tasks");
	await page.waitForLoadState("domcontentloaded");

	// Set session cookie
	await page.context().addCookies([
		{
			name: "session",
			value: "dummy-session-token",
			domain: "localhost",
			path: "/",
		},
	]);

	// Set user data in localStorage
	await page.evaluate(() => {
		localStorage.setItem(
			"user",
			JSON.stringify({
				id: "1",
				name: "Test User",
				email: "test@example.com",
				role: "ADMIN",
			}),
		);
	});

	// Save the authentication state
	await page.context().storageState({
		path: "playwright/.auth/user.json",
	});
});
