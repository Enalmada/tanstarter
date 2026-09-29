import { expect, test } from "@playwright/test";
import { SignInPage, SignUpPage } from "../pages/public/auth.page";

/**
 * Real better-auth flow: this project sends no test token, so sign-up, sign-in,
 * sessions and sign-out all go through better-auth and the database adapter
 * (the member and admin projects authenticate with a token header instead).
 * Each test creates its own throwaway user.
 */
function newUser() {
	const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	return { email: `e2e-${id}@example.test`, password: `Pw-${id}-aA1!` };
}

test.describe.configure({ mode: "serial" });

test.describe("Email and password auth", () => {
	const user = newUser();

	test("signs up, lands on tasks and has a database-backed session", async ({ page }) => {
		const signUp = new SignUpPage(page);
		await signUp.goto();
		await signUp.submit(user.email, user.password);
		await expect(page).toHaveURL(/\/tasks/, { timeout: 20_000 });

		// disableCookieCache forces a database lookup of the session (and its user)
		const response = await page.request.get("/api/auth/get-session?disableCookieCache=true");
		expect(response.ok()).toBe(true);
		const body = (await response.json()) as { user?: { email?: string; role?: string } } | null;
		expect(body?.user?.email).toBe(user.email);
		// Server-owned field, never client-settable
		expect(body?.user?.role).toBe("MEMBER");
	});

	test("signs in with the password and reaches a protected page", async ({ page }) => {
		const signIn = new SignInPage(page);
		await signIn.goto();
		await signIn.submit(user.email, user.password);
		await expect(page).toHaveURL(/\/tasks/, { timeout: 20_000 });

		await page.goto("/profile");
		await expect(page.getByText(user.email).first()).toBeVisible();
	});

	test("rejects a wrong password", async ({ page }) => {
		const signIn = new SignInPage(page);
		await signIn.goto();
		await signIn.submit(user.email, `${user.password}-wrong`);
		await expect(signIn.getErrorMessage()).toBeVisible();
		await expect(page).toHaveURL(/\/signin/);
	});

	test("signs out and loses access to protected pages", async ({ page }) => {
		const signIn = new SignInPage(page);
		await signIn.goto();
		await signIn.submit(user.email, user.password);
		await expect(page).toHaveURL(/\/tasks/, { timeout: 20_000 });

		await page.goto("/signout");
		await expect(page).toHaveURL(/\/(signin)?$/);

		await page.goto("/profile");
		await expect(page).toHaveURL(/\/signin/);
		const session = await page.request.get("/api/auth/get-session?disableCookieCache=true");
		expect(await session.json()).toBeNull();
	});
});

test("redirects anonymous visitors from protected pages", async ({ page }) => {
	await page.goto("/tasks");
	await expect(page).toHaveURL(/\/signin/);
});
