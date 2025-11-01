import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";
import { UserRole } from "~/server/db/schema";
import type { SessionUser } from "~/utils/auth-client";

// Mock users for testing
const mockMemberUser: SessionUser = {
	id: "test-user-id",
	email: "test@example.com",
	name: "Test User",
	role: UserRole.MEMBER,
	image: null,
	emailVerified: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockAdminUser: SessionUser = {
	...mockMemberUser,
	id: "test-admin-id",
	email: "admin@example.com",
	name: "Test Admin",
	role: UserRole.ADMIN,
};

// Extend the base test type to include auth context
export const test = base.extend<{
	memberPage: Page;
	adminPage: Page;
}>({
	memberPage: async ({ page }, use) => {
		// Set up member session data in localStorage
		await page.addInitScript((user: SessionUser) => {
			localStorage.setItem(
				"better-auth:session",
				JSON.stringify({
					user,
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
				}),
			);
		}, mockMemberUser);

		// Set auth header for API requests
		await page.setExtraHTTPHeaders({
			Authorization: "playwright-test-token",
		});

		await use(page);

		// Clean up after test
		await page.evaluate(() => {
			localStorage.removeItem("better-auth:session");
		});
	},

	adminPage: async ({ page }, use) => {
		// Set up admin session data in localStorage
		await page.addInitScript((user: SessionUser) => {
			localStorage.setItem(
				"better-auth:session",
				JSON.stringify({
					user,
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
				}),
			);
		}, mockAdminUser);

		// Set auth header for API requests
		await page.setExtraHTTPHeaders({
			Authorization: "playwright-admin-test-token",
		});

		await use(page);

		// Clean up after test
		await page.evaluate(() => {
			localStorage.removeItem("better-auth:session");
		});
	},
});
