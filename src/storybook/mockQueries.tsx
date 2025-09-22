import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a QueryClient with pre-populated mock data for Storybook stories
 * This ensures consistent mock data across stories and prevents network calls
 */
export function createMockQueryClient(): QueryClient {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: Number.POSITIVE_INFINITY, // Never refetch in Storybook
				gcTime: Number.POSITIVE_INFINITY, // Keep data forever in Storybook
			},
			mutations: {
				retry: false,
			},
		},
	});

	return queryClient;
}
