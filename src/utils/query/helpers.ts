import type { QueryClient, QueryKey } from "@tanstack/react-query";

export const revertCache = (queryClient: QueryClient, items: { queryKey: QueryKey; data: unknown }[]) => {
	for (const { queryKey, data } of items) {
		if (data) {
			queryClient.setQueryData(queryKey, data);
		}
	}
};
