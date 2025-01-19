/**
 * User service implementation
 * Handles all user-related database operations
 */

import { createServerFn } from "@tanstack/start";
import { object, safeParse, string } from "valibot";
import DB from "../db";

import { authMiddleware } from "~/middleware/auth-guard";
import { accessCheck } from "~/server/access/check";
import { buildWhereClause } from "~/server/db/DrizzleOrm";
import { UserTable, userInsertSchema } from "../db/schema";

// Create the base service instance
/*
const userService = createBaseService<
	typeof UserTable.$inferSelect,
	UserInsert
>(UserTable, "User");
*/

export const subject = "User";

// Export server functions directly for TanStack Start to discover
export const fetchUsers = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.handler(async ({ data, context }) => {
		accessCheck(context.user, "list", subject, data);

		const config = { limit: undefined, offset: undefined };
		const where = buildWhereClause(UserTable, {});
		// const orderBy = buildOrderByClause(TaskTable, criteria);

		const tasks = await DB.query.UserTable.findMany({
			where,
			//orderBy,
			limit: config.limit,
			offset: config.offset,
		});
		return tasks;
	});

/*
export const fetchUser = createServerFn({ method: "GET" })
	.validator(validateId)
	.middleware([authMiddleware])
	.handler(async ({ data: id, context }) => {
		const result = await DB.query.UserTable.findFirst({
			where: eq(UserTable.id, id),
		});

		if (!result) {
			throw new Error(`${subject} ${id} not found`);
		}

		accessCheck(context.user, "read", subject, result);

		return result;
	});
*/

export function validateNewUser(input: unknown) {
	if (!input || typeof input !== "object") {
		throw new Error("Invalid user data: Input must be an object");
	}

	const result = safeParse(userInsertSchema, input);
	if (!result.success) {
		const errorMessage = result.issues
			.map((issue) => {
				const path = issue.path?.[0]?.key;
				return path ? `${path}: ${issue.message}` : issue.message;
			})
			.join(", ");
		throw new Error(`Invalid user data: ${errorMessage}`);
	}

	return result.output;
}

const validateUpdateUser = object({
	id: string(),
	data: userInsertSchema,
});

/*
export const createUser = createServerFn({ method: "POST" })
	.validator(validateNewUser)
	.middleware([authMiddleware])
	.handler(async ({ data, context }) => {
		const createWith = {
			...data,
			createdById: context.user.id,
			updatedById: context.user.id,
		};

		accessCheck(context.user, "create", subject, createWith);

		const [result] = await DB.insert(UserTable).values(createWith).returning();

		return result;
	});
*/

/*
export const updateUser = createServerFn({ method: "POST" })
	.validator(validateUpdateUser)
	.middleware([authMiddleware])
	.handler(async ({ data: { id, data }, context }) => {
		const entity = await DB.query.UserTable.findFirst({
			where: eq(UserTable.id, id),
		});

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		if (entity.version !== data.version) {
			throw new Error(
				`${subject} has changed since loading. Please reload and try again.`,
			);
		}

		accessCheck(context.user, "update", subject, entity);

		const updateWith = {
			...data,
			updatedById: context.user.id,
			version: entity.version + 1,
		};

		const [result] = await DB.update(UserTable)
			.set(updateWith)
			.where(eq(UserTable.id, id))
			.returning();

		return result;
	});
*/

/*
export const deleteUser = createServerFn({ method: "POST" })
	.validator(validateId)
	.middleware([authMiddleware])
	.handler(async ({ data: id, context }) => {
		const entity = await DB.query.UserTable.findFirst({
			where: eq(UserTable.id, id),
		});

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		accessCheck(context.user, "delete", subject, entity);

		const [result] = await DB.delete(UserTable)
			.where(eq(UserTable.id, id))
			.returning();

		return result;
	});
*/

/*
export const fetchUserOptions = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		accessCheck(context.user, "list", subject, {});

		const users = await DB.query.UserTable.findMany({
			columns: {
				id: true,
				email: true,
				name: true,
			},
		});

		return users.map(user => ({
			value: user.id,
			label: user.name || user.email,
		}));
	});
	*/

// Create service objects that use the server functions
export const adminUserService = {
	fetchUsers,
	// fetchUser,
};

export const clientUserService = {
	fetchUsers,
	//fetchUser,
};
