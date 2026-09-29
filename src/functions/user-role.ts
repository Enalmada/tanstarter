import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { object, picklist, safeParse, string } from "valibot";
import { freshAuthMiddleware } from "~/functions/auth-middleware";
import { BadRequestError } from "~/server/access/http-errors";
import type { SessionUser } from "~/server/auth/auth";
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

export const handleMakeUserAdmin = createServerOnlyFn(
	async ({ data, context }: { data: { userId: string; role: UserRoleLiteral }; context: { user: SessionUser } }) => {
		const { userId, role } = data;

		const { logger } = await import("~/utils/logger");
		const { getUserById, updateUserRole } = await import("./user.db");
		const { NotAuthorizedError, NotFoundError } = await import("~/server/access/http-errors");
		const { getOptionalSessionUser } = await import("~/server/auth/session");
		const { isRoleSelfServiceEnabled } = await import("~/server/access/role-self-service");

		// freshAuthMiddleware already rejected anonymous callers (401) and read the
		// role from the DB rather than the cookie cache.
		const currentUser = context.user;
		logger.info("makeUserAdmin", { userId, role, currentUserId: currentUser.id });

		// Admins may change anyone's role. Everyone else may only flip their OWN
		// role, and only where self-service is enabled (local dev or DEMO_MODE) —
		// otherwise any member could promote themselves or demote real admins.
		const isAdmin = currentUser.role === "ADMIN";
		const isSelfService = userId === currentUser.id && isRoleSelfServiceEnabled();
		if (!isAdmin && !isSelfService) {
			throw new NotAuthorizedError(`User ${currentUser.id} may not change the role of ${userId}`);
		}

		// Find the user to update
		const [userToUpdate] = await getUserById(userId);
		if (!userToUpdate) {
			throw new NotFoundError(`User ${userId} not found`);
		}

		// Update the user's role
		const [updatedUser] = await updateUserRole(userId, role as UserRole, currentUser.id);

		// Refresh the session cookie cache so a hard refresh observes the new role.
		// Best-effort: `getOptionalSessionUser({ freshFromDb: true })` re-queries the
		// DB AND forwards the Set-Cookie headers via the helper. If the
		// AsyncLocalStorage context isn't active for some reason, the helper
		// returns null and we just skip silently.
		await getOptionalSessionUser({ freshFromDb: true });

		return updatedUser;
	},
);

export const makeUserAdmin = createServerFn({ method: "POST" })
	.middleware([freshAuthMiddleware])
	.validator(validateMakeAdmin)
	.handler(handleMakeUserAdmin);

export const handleGetRoleSelfService = createServerOnlyFn(async () => {
	const { isRoleSelfServiceEnabled } = await import("~/server/access/role-self-service");
	return isRoleSelfServiceEnabled();
});

/** Whether the Profile page should offer the self-service role toggle. */
export const getRoleSelfService = createServerFn({ method: "GET" }).handler(handleGetRoleSelfService);
