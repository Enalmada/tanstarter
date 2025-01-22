// https://github.com/lukemorales/query-key-factory#readme
import {
	createQueryKeyStore,
	type inferQueryKeyStore,
} from "@lukemorales/query-key-factory";
import { getSessionUser } from "~/routes/__root";
import type { Task, User } from "~/server/db/schema";
import { findFirst, findMany } from "~/server/services/base-service";

export const queries = createQueryKeyStore({
	task: {
		list: (userId?: string) => ({
			queryKey: [userId || "all"],
			queryFn: () =>
				findMany({ data: { where: { userId }, subject: "Task" } }) as Promise<
					Task[]
				>,
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
		list: {
			queryKey: null,
			queryFn: () => findMany({ data: { subject: "User" } }) as Promise<User[]>,
		},
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
