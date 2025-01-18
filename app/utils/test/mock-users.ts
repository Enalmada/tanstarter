import type { SessionUser } from "../auth-client";

// Mock users for testing
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
