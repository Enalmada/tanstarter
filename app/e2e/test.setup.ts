import { test as base } from "@playwright/test";
import { mockUser } from "~/e2e/global.setup";
import type { SessionUser } from "~/utils/auth-client";

// Extend the base test with auth fixtures
export const test = base.extend<{
	mockUser: SessionUser;
}>({
	mockUser: async (testInfo, use) => {
		await use(mockUser);
	},
});

export { expect } from "@playwright/test";
