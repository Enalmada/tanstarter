// https://github.com/lukemorales/query-key-factory#readme
import {
	createQueryKeyStore,
	type inferQueryKeyStore,
} from "@lukemorales/query-key-factory";
import { findFirst, findMany } from "~/functions/base-service";
import { getSessionUser } from "~/functions/session";
import type { Task, User } from "~/server/db/schema";

/**
 * Makes all properties of T optional and allows undefined values
 * Similar to Partial<T> but handles exactOptionalPropertyTypes more strictly
 * @example
 * // With exactOptionalPropertyTypes: true
 * type User = { name: string, age: number }
 * type PartialUser = Partial<User> // { name?: string, age?: number }
 * type UndefinedUser = AllowUndefined<User> // { name?: string | undefined, age?: number | undefined }
 */
type AllowUndefined<T> = { [P in keyof T]?: T[P] | undefined };

/**
 * Creates standard CRUD query configurations for a given entity type
 * @param subject The entity type name as a string (e.g. "Task", "User")
 * @returns Object containing list and detail query configurations
 */
function createCrudQueries<T extends { id: string }>(subject: string) {
	return {
		list: (filters?: AllowUndefined<T>) => ({
			queryKey: [{ filters }] as const,
			queryFn: () =>
				findMany({
					data: { where: { ...filters }, subject },
				}) as Promise<T[]>,
		}),
		byId: (id: string) => ({
			queryKey: [id] as const,
			queryFn: () =>
				findFirst({
					data: { where: { id }, subject },
				}) as Promise<T>,
		}),
	};
}

export const queries = createQueryKeyStore({
	task: createCrudQueries<Task>("Task"),
	user: {
		...createCrudQueries<User>("User"),
		session: {
			queryKey: null,
			queryFn: async () => {
				return await getSessionUser();
			},
		},
	},
});

// Type inference helper
export type QueryKeys = inferQueryKeyStore<typeof queries>;
