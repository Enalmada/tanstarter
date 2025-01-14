import { test as base } from "@playwright/test";
import type { ClientUser } from "~/server/db/schema";
import { UserRole } from "~/server/db/schema";

// Extend the base test with auth fixtures
export const test = base.extend<{
	mockUser: ClientUser;
}>({
	mockUser: async (testInfo, use) => {
		// Create a mock user
		const mockUser: ClientUser = {
			id: "test-user-id",
			email: "test@example.com",
			name: "Test User",
			role: UserRole.MEMBER,
			avatarUrl: null,
			setupAt: null,
		};

		await use(mockUser);
	},
});

export { expect } from "@playwright/test";
