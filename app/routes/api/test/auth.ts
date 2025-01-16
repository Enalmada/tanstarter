import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";

// Mock users for testing - keep in sync with auth-guard.ts
const mockTestUser = {
	id: "test-user-id",
	email: "test@example.com",
	name: "Test User",
	role: "MEMBER",
	image: null,
	emailVerified: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockAdminUser = {
	...mockTestUser,
	id: "test-admin-id",
	email: "admin@example.com",
	name: "Test Admin",
	role: "ADMIN",
};

export const testAuth = createServerFn({ method: "GET" }).handler(async () => {
	// Only available in development
	if (process.env.NODE_ENV !== "development") {
		throw new Error("Test auth only available in development");
	}

	const { headers } = getWebRequest();
	const authHeader = headers.get("authorization");

	if (authHeader === "playwright-test-token") {
		return { user: mockTestUser };
	}
	if (authHeader === "playwright-admin-test-token") {
		return { user: mockAdminUser };
	}

	throw new Error("Invalid test token");
});
