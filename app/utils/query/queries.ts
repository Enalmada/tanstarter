// https://github.com/lukemorales/query-key-factory#readme
import {
	createQueryKeyStore,
	type inferQueryKeyStore,
} from "@lukemorales/query-key-factory";
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
			queryFn: () => clientTaskService.fetchTask({ data: { id } }),
		}),
	},
	/* TODO - cache user session to enable offline support and improve performance
	user: {
		auth: {
			queryKey: null,
			queryFn: async () => {
				const { user } = await getAuthSession();
				return user;
			},
		},
	},
	*/
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
			queryFn: () => adminTaskService.fetchTask({ data: { id } }),
		}),
	},
	adminUser: {
		list: {
			queryKey: null,
			queryFn: () => adminUserService.fetchUsers(),
		},
		detail: (id: string) => ({
			queryKey: [id],
			queryFn: () => adminUserService.fetchUser({ data: { id } }),
		}),
	},
});

// Type inference helper
export type AdminQueryKeys = inferQueryKeyStore<typeof adminQueries>;
