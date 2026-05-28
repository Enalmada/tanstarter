import { getRequest } from "@tanstack/react-start/server";
import { UserRole } from "~/lib/enums/user-role";
import type { SessionUser } from "~/utils/auth-client";

// Mock users for testing - keep in sync with auth-guard.ts
export const mockTestUser: SessionUser = {
	id: "test-user-id",
	email: "test@example.com",
	name: "Test User",
	role: UserRole.MEMBER,
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
	role: UserRole.ADMIN,
};

/**
 * Check for Playwright test tokens in development mode
 * Returns mock user if valid test token is found, null otherwise
 */
export const checkPlaywrightTestAuth = () => {
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	// TanStack Start v1.134+ requires the per-request AsyncLocalStorage context
	// for getRequest() to resolve. During SSR initialization / dehydration
	// the context may not yet be active and the call throws — handle that
	// gracefully so the auth path falls through to the real session lookup
	// instead of crashing every page render.
	let request: Request | undefined;
	try {
		request = getRequest();
	} catch (_error) {
		return null;
	}
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
