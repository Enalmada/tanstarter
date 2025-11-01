import { UserRole } from "~/server/db/schema";
import type { SessionUser } from "~/utils/auth-client";

// Create a mock user
export const mockUser: SessionUser = {
	id: "test-user-id",
	email: "test@example.com",
	name: "Test User",
	role: UserRole.MEMBER,
	image: null,
	emailVerified: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};
