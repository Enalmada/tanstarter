import { createServerFn } from "@tanstack/react-start";
import { object, picklist, safeParse, string } from "valibot";
import { BadRequestError } from "~/server/access/http-errors";
import type { UserRole } from "~/server/db/schema";

// Mirror the schema's role union as a pure-valibot picklist so this file
// stays Drizzle-free at top level (TSS-2). The values match the UserRole
// enum exactly; we cast at the boundary into updateUserRole since the
// enum members are nominal types distinct from their string literals.
type UserRoleLiteral = "MEMBER" | "ADMIN";
const userRoleValues = ["MEMBER", "ADMIN"] as const satisfies readonly UserRoleLiteral[];
const userRoleInputSchema = picklist(userRoleValues);

const validateMakeAdminSchema = object({
	userId: string(),
	role: userRoleInputSchema,
});

function validateMakeAdmin(input: unknown) {
	const result = safeParse(validateMakeAdminSchema, input);
	if (!result.success) {
		throw new BadRequestError(result.issues.map((i) => i.message).join("; "));
	}
	return result.output;
}

export async function handleMakeUserAdmin({ data }: { data: { userId: string; role: UserRoleLiteral } }) {
	const { userId, role } = data;

	const { logger } = await import("~/utils/logger");
	const { getUserById, updateUserRole } = await import("./user.db");
	const { auth } = await import("~/server/auth/auth");
	const { getRequest } = await import("@tanstack/react-start/server");
	const { NotFoundError } = await import("~/server/access/http-errors");

	const currentUser = await getAuthedUser();
	logger.info("makeUserAdmin", { userId, role, currentUserId: currentUser.id });

	// Find the user to update
	const [userToUpdate] = await getUserById(userId);
	if (!userToUpdate) {
		throw new NotFoundError(`User ${userId} not found`);
	}

	// Update the user's role
	const [updatedUser] = await updateUserRole(userId, role as UserRole, currentUser.id);

	// Refresh the session cookie cache with updated user data
	// This forces a DB fetch and updates the cookie so hard refresh reflects the change
	const request = getRequest();
	if (request) {
		await auth.api.getSession({
			headers: request.headers,
			query: { disableCookieCache: true },
		});
	}

	return updatedUser;
}

export const makeUserAdmin = createServerFn({ method: "POST" })
	.inputValidator(validateMakeAdmin)
	.handler(handleMakeUserAdmin);

// ---------------------------------------------------------------------------
// Local auth helper — kept after the createServerFn so the file still ends
// with the public registration. Dynamic-imports everything server-only.

async function getAuthedUser() {
	const { checkPlaywrightTestAuth } = await import("~/utils/test/playwright");
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) return mockUser;

	const { getRequest, setResponseStatus } = await import("@tanstack/react-start/server");
	const request = getRequest();
	if (!request) {
		setResponseStatus(500);
		throw new Error("No web request available");
	}

	const { auth } = await import("~/server/auth/auth");
	const session = await auth.api.getSession({
		headers: request.headers,
		query: { disableCookieCache: true },
	});

	if (!session) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return session.user;
}
