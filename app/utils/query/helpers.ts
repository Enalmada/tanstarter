import type { QueryClient } from "@tanstack/react-query";

export const revertCache = (
	queryClient: QueryClient,
	items: { queryKey: any; data: any }[],
) => {
	items.forEach(({ queryKey, data }) => {
		if (data) {
			queryClient.setQueryData(queryKey, data);
		}
	});
};
