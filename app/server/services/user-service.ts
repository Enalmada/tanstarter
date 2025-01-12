/**
 * User service implementation
 * Handles all user-related database operations
 */

import { createServerFn } from "@tanstack/start";
import { desc, eq } from "drizzle-orm";
import { object, string } from "valibot";
import { getAuthSession } from "~/server/auth/auth";
import DB from "../db";
import { user, userInsertSchema } from "../db/schema";
import { getAuthenticatedUser, validateId } from "./base-service";

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

const validateNewUser = object({
	data: userInsertSchema,
});

const validateUpdateUser = object({
	id: string(),
	data: userInsertSchema,
});

export const createUser = createServerFn({ method: "POST" })
	.validator(validateNewUser)
	.handler(async ({ data }) => {
		const [result] = await DB.insert(user)
			.values({
				...data.data,
			})
			.returning()
			.execute();
		return result;
	});

export const updateUser = createServerFn({ method: "POST" })
	.validator(validateUpdateUser)
	.handler(async ({ data }) => {
		const [result] = await DB.update(user)
			.set(data.data)
			.where(eq(user.id, data.id))
			.returning()
			.execute();

		if (!result) {
			throw new Error("User not found");
		}

		return result;
	});

export const deleteUser = createServerFn({ method: "POST" })
	.validator(object({ id: string() }))
	.handler(async ({ data }) => {
		const [result] = await DB.delete(user)
			.where(eq(user.id, data.id))
			.returning()
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
	createUser,
	updateUser,
	deleteUser,
};

export const clientUserService = {
	fetchUsers,
	fetchUser,
};
