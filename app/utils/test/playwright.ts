import { getWebRequest } from "@tanstack/start/server";
import type { SessionUser } from "~/utils/auth-client";

// Mock users for testing - keep in sync with auth-guard.ts
export const mockTestUser: SessionUser = {
	id: "test-user-id",
	email: "test@example.com",
	name: "Test User",
	role: "MEMBER",
	image: null,
	emailVerified: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};

export const mockAdminUser: SessionUser = {
	...mockTestUser,
	id: "test-admin-id",
	email: "admin@example.com",
	name: "Test Admin",
	role: "ADMIN",
};

/**
 * Check for Playwright test tokens in development mode
 * Returns mock user if valid test token is found, null otherwise
 */
export const checkPlaywrightTestAuth = () => {
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	const request = getWebRequest();
	if (!request) {
		return null;
	}

	const authHeader = request.headers.get("authorization");

	if (authHeader === "playwright-test-token") {
		return mockTestUser;
	}
	if (authHeader === "playwright-admin-test-token") {
		return mockAdminUser;
	}

	return null;
};
