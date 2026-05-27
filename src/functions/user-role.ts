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
	const { NotFoundError } = await import("~/server/access/http-errors");
	const { requireAuthedUser, getOptionalSessionUser } = await import("~/server/auth/session");

	// requireAuthedUser handles the Playwright test-auth shortcut, the v1.134+
	// getRequest() defensive try/catch, asResponse cookie forwarding, and the
	// 401-on-no-session throw — all centralized in ~/server/auth/session.
	const currentUser = await requireAuthedUser({ freshFromDb: true });
	logger.info("makeUserAdmin", { userId, role, currentUserId: currentUser.id });

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
}

export const makeUserAdmin = createServerFn({ method: "POST" })
	.inputValidator(validateMakeAdmin)
	.handler(handleMakeUserAdmin);
