/**
 * TanStack Router configuration
 * Sets up router instance with route tree and context
 * Configures router defaults and error boundaries
 */

import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import type { ReactNode } from "react";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
	// Create QueryClient here as recommended by TanStack examples
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5, // 5 minutes
				gcTime: 1000 * 60 * 60 * 24, // 24 hours
			},
		},
	});

	return routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			context: { queryClient, user: null },
			// Let React Query handle stale data and preloading
			defaultPreloadStaleTime: 0,
			defaultPreload: "intent" as const,
			defaultErrorComponent: DefaultCatchBoundary,
			defaultNotFoundComponent: NotFound,
			Wrap: ({ children }: { children: ReactNode }) => (
				<I18nProvider i18n={i18n}>{children}</I18nProvider>
			),
		}),
		queryClient,
	);
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}
