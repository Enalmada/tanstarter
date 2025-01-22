// https://github.com/lukemorales/query-key-factory#readme
import {
	createQueryKeyStore,
	type inferQueryKeyStore,
} from "@lukemorales/query-key-factory";
import { getSessionUser } from "~/routes/__root";
import type { Task, User } from "~/server/db/schema";
import { findFirst, findMany } from "~/server/services/base-service";

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

export const queries = createQueryKeyStore({
	task: {
		list: (filters?: AllowUndefined<Task>) => ({
			queryKey: [{ filters }],
			queryFn: () =>
				findMany({
					data: { where: { ...filters }, subject: "Task" },
				}) as Promise<Task[]>,
		}),
		detail: (id: string) => ({
			queryKey: [id],
			queryFn: () =>
				findFirst({
					data: { where: { id }, subject: "Task" },
				}) as Promise<Task>,
		}),
	},
	user: {
		list: (filters?: Partial<User>) => ({
			queryKey: [{ filters }],
			queryFn: () =>
				findMany({
					data: { where: { ...filters }, subject: "User" },
				}) as Promise<User[]>,
		}),
		detail: (id: string) => ({
			queryKey: [id],
			queryFn: () =>
				findFirst({
					data: { where: { id }, subject: "User" },
				}) as Promise<User>,
		}),
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
