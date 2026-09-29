import { expect, test } from "@playwright/test";
import { SignInPage, SignUpPage } from "../pages/public/auth.page";

/**
 * Real better-auth flow: this project sends no test token, so sign-up, sign-in,
 * sessions and sign-out all go through better-auth and the database adapter
 * (the member and admin projects authenticate with a token header instead).
 * One throwaway user per group run (new on every retry, so a retry never hits "user
 * already exists"). Users are removed by `bun run drizzle:seed`, which the Playwright
 * webServer command runs on a cold start; with a reused dev server they linger until then.
 */
function newUser() {
	const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	return { email: `e2e-${id}@example.test`, password: `Pw-${id}-aA1!` };
}

test.describe.configure({ mode: "serial" });

test.describe("Email and password auth", () => {
	let user: ReturnType<typeof newUser>;

	test.beforeAll(() => {
		user = newUser();
	});

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

	test("sends a signed-out visitor back to the page they asked for after signing in", async ({ page }) => {
		const signIn = new SignInPage(page);
		await page.goto("/tasks/new");
		await expect(page).toHaveURL(/\/signin\?redirect=%2Ftasks%2Fnew$/);
		await signIn.waitForPageLoad(); // hydrated, or the click submits a native GET form

		await signIn.submit(user.email, user.password);
		await expect(page).toHaveURL(/\/tasks\/new$/, { timeout: 20_000 });
	});

	test("ignores an off-site ?redirect= after signing in", async ({ page }) => {
		const signIn = new SignInPage(page);
		await page.goto("/signin?redirect=https://evil.test/phish");
		await signIn.waitForPageLoad();
		await signIn.submit(user.email, user.password);
		await expect(page).toHaveURL(/\/tasks$/, { timeout: 20_000 });
		expect(new URL(page.url()).origin).toBe("http://localhost:3000");
	});

	test("moves a signed-in user off the sign-in page, to ?redirect= when it is local", async ({ page }) => {
		await new SignInPage(page).goto();
		await new SignInPage(page).submit(user.email, user.password);
		await expect(page).toHaveURL(/\/tasks$/, { timeout: 20_000 });

		await page.goto("/signin");
		await expect(page).toHaveURL(/\/tasks$/);
		await page.goto("/signup?redirect=%2Fprofile");
		await expect(page).toHaveURL(/\/profile$/);
		await page.goto("/signin?redirect=https://evil.test");
		await expect(page).toHaveURL(/\/tasks$/);
	});

	test("shows no protected content when going back after signing out", async ({ page }) => {
		await new SignInPage(page).goto();
		await new SignInPage(page).submit(user.email, user.password);
		await expect(page).toHaveURL(/\/tasks$/, { timeout: 20_000 });
		await page.goto("/profile");
		await expect(page.getByText(user.email).first()).toBeVisible();

		await page.goto("/signout");
		await expect(page).toHaveURL(/\/(signin)?$/);
		await page.goBack();
		await expect(page).toHaveURL(/\/signin\?redirect=%2Fprofile$/);
		await expect(page.getByText(user.email)).toHaveCount(0);
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
