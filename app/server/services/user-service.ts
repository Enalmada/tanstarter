/**
 * User service implementation
 * Handles all user-related database operations
 */

import { createServerFn } from "@tanstack/start";
import { desc, eq } from "drizzle-orm";
import { object, safeParse, string } from "valibot";
import { getAuthSession } from "~/server/auth/auth";
import DB from "../db";
import { user } from "../db/schema";
import type { ClientUser, User } from "../db/schema";
import { getAuthenticatedUser, idSchema, validateId } from "./base-service";

export const getUserAuth = createServerFn({ method: "GET" }).handler(
	async () => {
		const { user } = await getAuthSession();
		return user;
	},
);

// Export server functions directly for TanStack Start to discover
export const fetchUsers = createServerFn({
	method: "GET",
}).handler(async () => {
	await getAuthenticatedUser();
	const users = await DB.select()
		.from(user)
		.orderBy(desc(user.created_at))
		.execute();
	return users;
});

export const fetchUser = createServerFn({ method: "GET" })
	.validator(validateId)
	.handler(async ({ data: userId }) => {
		await getAuthenticatedUser();
		const [result] = await DB.select()
			.from(user)
			.where(eq(user.id, userId))
			.execute();

		if (!result) {
			throw new Error("User not found");
		}

		return result;
	});

// Create service objects that use the server functions
export const adminUserService = {
	fetchUsers,
	fetchUser,
};

export const clientUserService = {
	fetchUsers,
	fetchUser,
};
