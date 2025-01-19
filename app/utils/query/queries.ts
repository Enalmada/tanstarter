// https://github.com/lukemorales/query-key-factory#readme
import {
	createQueryKeyStore,
	type inferQueryKeyStore,
} from "@lukemorales/query-key-factory";
import { getSessionUser } from "~/routes/__root";
import { findFirst } from "~/server/services/base-service";
import {
	adminTaskService,
	clientTaskService,
} from "~/server/services/task-service";
import { adminUserService } from "~/server/services/user-service";

export const queries = createQueryKeyStore({
	task: {
		list: (userId?: string) => ({
			queryKey: [userId || "all"],
			queryFn: () =>
				clientTaskService.fetchTasks(userId ? { data: { userId } } : undefined),
		}),
		detail: (id: string) => ({
			queryKey: [id],
			queryFn: () => findFirst({ data: { id, subject: "Task" } }),
		}),
	},
	user: {
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

export const adminQueries = createQueryKeyStore({
	adminTask: {
		list: {
			queryKey: null,
			queryFn: () => adminTaskService.fetchTasks(),
		},
		detail: (id: string) => ({
			queryKey: [id],
			queryFn: () => findFirst({ data: { id, subject: "Task" } }),
		}),
	},
	adminUser: {
		list: {
			queryKey: null,
			queryFn: () => adminUserService.fetchUsers(),
		},
		detail: (id: string) => ({
			queryKey: [id],
			queryFn: () => findFirst({ data: { id, subject: "User" } }),
		}),
	},
});

// Type inference helper
export type AdminQueryKeys = inferQueryKeyStore<typeof adminQueries>;
