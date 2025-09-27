import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { object, safeParse, string } from "valibot";
import { auth, type SessionUser } from "~/server/auth/auth";
import db from "~/server/db";
import { UserTable, userRoleSchema } from "~/server/db/schema";
import { logger } from "~/utils/logger";
import { checkPlaywrightTestAuth } from "~/utils/test/playwright";

export const validateMakeAdmin = object({
	userId: string(),
	role: userRoleSchema,
});

export const makeUserAdmin = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => {
		const result = safeParse(validateMakeAdmin, input);
		if (!result.success) {
			throw new Error("Invalid input data");
		}
		return result.output;
	})
	.handler(async ({ data: { userId, role } }) => {
		const currentUser = await getUser();
		logger.info("makeUserAdmin", { userId, role, currentUserId: currentUser.id });

		// Find the user to update
		const [userToUpdate] = await db.select().from(UserTable).where(eq(UserTable.id, userId)).limit(1);

		if (!userToUpdate) {
			throw new Error("User not found");
		}

		// Update the user's role
		const [updatedUser] = await db
			.update(UserTable)
			.set({
				role,
				updatedAt: new Date(),
				updatedById: currentUser.id,
			})
			.where(eq(UserTable.id, userId))
			.returning();

		return updatedUser;
	});

const getUser = async (): Promise<SessionUser> => {
	const mockUser = checkPlaywrightTestAuth();
	if (mockUser) {
		return mockUser;
	}

	const request = getRequest();
	if (!request) {
		setResponseStatus(500);
		throw new Error("No web request available");
	}

	const session = await auth.api.getSession({
		headers: request.headers,
		query: {
			disableCookieCache: true,
		},
	});

	if (!session) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return session.user;
};
