import { UserRole } from "~/server/db/schema";
import type { ClientUser } from "~/server/db/schema";

// Create a mock user
export const mockUser: ClientUser = {
	id: "test-user-id",
	email: "test@example.com",
	name: "Test User",
	role: UserRole.MEMBER,
	avatarUrl: null,
	setupAt: null,
};
