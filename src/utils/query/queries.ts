/**
 * Context-Aware Query System for TanStack Start
 *
 * This module provides an elegant, zero-configuration approach to server function queries:
 *
 * **CONTEXT-AWARE PATTERN**:
 * 1. Server functions automatically detect React vs server context
 * 2. Same query definitions work in both loaders and components
 * 3. Zero manual mapping or configuration required
 * 4. Adding new server functions requires no wrapper changes
 *
 * **Example**:
 * ```ts
 * // Define route queries once - work everywhere automatically
 * function getRouteQueries(taskId: string) {
 *   return [queries.task.byId(taskId), queries.user.session] as const;
 * }
 *
 * // Route loader - uses raw server functions
 * loader: async ({ context, params }) => {
 *   const [task] = await preloadQueries(context.queryClient, getRouteQueries(params.taskId));
 * }
 *
 * // Component - automatically wrapped with useServerFn
 * function Component() {
 *   const [task, user] = useSuspenseQueries(getRouteQueries(taskId));
 * }
 * ```
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/server-functions#calling-server-functions-from-hooks-and-components
 * @see https://github.com/lukemorales/query-key-factory#readme
 */
import { createQueryKeyStore, type inferQueryKeyStore } from "@lukemorales/query-key-factory";
import { type QueryClient, useSuspenseQueries as useSuspenseQueriesBuiltIn } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { findFirst, findMany } from "~/functions/base-service";
import { getSessionUser } from "~/functions/session";
import type { Task, User } from "~/server/db/schema";

/**
 * Context-aware server function wrapper
 * Automatically uses useServerFn when called from React components,
 * or raw server function when called from server contexts (loaders, etc.)
 */
// biome-ignore lint/suspicious/noExplicitAny: Server functions need flexible typing for compatibility
function useContextAwareServerFn<T extends (...args: any[]) => any>(serverFn: T) {
	// Check if we're in a browser environment (React component context)
	// In server/loader/test context, window is undefined
	if (typeof window !== "undefined") {
		// biome-ignore lint/correctness/useHookAtTopLevel: This is safe - we've verified we're in browser context
		return useServerFn(serverFn);
	} else {
		// Server context (route loader, test environment, etc.) - use raw server function
		return serverFn;
	}
}

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
 * Helper to preload multiple queries in parallel for route loaders
 *
 * This enables efficient server-side rendering by preloading the same queries
 * that components will use, following the single source of truth pattern.
 *
 * @param queryClient The QueryClient instance from route context
 * @param queries Array of query configurations to preload (same as used in components)
 * @returns Promise that resolves to an array of the preloaded data in the same order as queries
 *
 * @example
 * ```ts
 * // In route loader
 * export const Route = createFileRoute("/tasks/$taskId")({
 *   loader: async ({ context, params }) => {
 *     const [task] = await preloadQueries(context.queryClient, getRouteQueries(params.taskId));
 *     // Now you can use the task data directly
 *   },
 * });
 * ```
 */
// Type helpers for preloadQueries (borrowed from useSuspenseQueries)
type PreloadQueries_RawReturnType<TQueryFn> = TQueryFn extends (
	// biome-ignore lint/suspicious/noExplicitAny: For generic inference helper
	context: any,
) => infer R
	? R
	: never;

type PreloadQueries_PeelPromise<R> = R extends Promise<infer P> ? P : R;

type PreloadQueries_InferQueryFnData<TQueryFn> = PreloadQueries_PeelPromise<PreloadQueries_RawReturnType<TQueryFn>>;

type PreloadQueries_ExtractDataFromConfig<TConfig> = TConfig extends {
	queryFn: infer TQueryFn;
}
	? PreloadQueries_InferQueryFnData<TQueryFn>
	: unknown;

export async function preloadQueries<
	const TConfigTuple extends ReadonlyArray<
		{
			// QueryFn can return TData or Promise<TData>
			// biome-ignore lint/suspicious/noExplicitAny: Used for broad compatibility in generic constraint
			queryFn: (context: any) => any | Promise<any>;
			// biome-ignore lint/suspicious/noExplicitAny: QueryKey can be any serializable value
			queryKey: any;
		} & Record<string, unknown>
	>,
>(
	queryClient: QueryClient,
	queries: TConfigTuple,
): Promise<{
	[K in keyof TConfigTuple]: PreloadQueries_ExtractDataFromConfig<TConfigTuple[K]>;
}> {
	// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for empty array case
	if (!queries.length) return [] as any;

	// Use fetchQuery (not prefetchQuery) to both cache AND return the data
	// This enables route loaders to use the returned data directly while still
	// populating the cache for components. The overhead is minimal since the
	// query client caches the data either way.
	const results = await Promise.all(
		queries.map((query) =>
			// biome-ignore lint/suspicious/noExplicitAny: QueryClient typing needs flexibility
			queryClient.fetchQuery(query as any),
		),
	);

	// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for complex generic return type
	return results as any;
}

/**
 * Pure generic useSuspenseQueries that preserves proper typing for array destructuring
 * No server function knowledge required - context-aware wrapping handled at query level
 *
 * @example
 * ```ts
 * const [tasks, user] = useSuspenseQueries([
 *   queries.task.list(),
 *   queries.user.session,
 * ]);
 * // tasks: Task[], user: User
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Any is needed for the config type
export function useSuspenseQueries<T extends readonly unknown[]>(configs: T): any[] {
	// Pure implementation - queries handle their own context-aware wrapping
	const results = useSuspenseQueriesBuiltIn({ queries: configs });

	// Extract just the data from each result
	return results.map((result) => result.data);
}

/**
 * Creates standard CRUD query configurations for a given entity type
 * Uses context-aware server functions that work in both React and server contexts
 * @param subject The entity type name as a string (e.g. "Task", "User")
 * @returns Object containing list and detail query configurations
 */
function createCrudQueries<T extends { id: string }>(subject: string) {
	return {
		list: (filters?: AllowUndefined<T>) => ({
			queryKey: [{ filters }] as const,
			queryFn: () =>
				// Context-aware: uses useServerFn in components, raw function in loaders
				useContextAwareServerFn(findMany)({
					data: { where: { ...filters }, subject },
				}) as Promise<T[]>,
		}),
		byId: (id: string) => ({
			queryKey: [id] as const,
			queryFn: () =>
				// Context-aware: uses useServerFn in components, raw function in loaders
				useContextAwareServerFn(findFirst)({
					data: { where: { id }, subject },
				}) as Promise<T>,
		}),
	};
}

/**
 * Global query store with context-aware server functions
 * - Automatically uses useServerFn in React components
 * - Uses raw server functions in server contexts (loaders, beforeLoad)
 * - Single definition works everywhere with zero configuration
 */
export const queries = createQueryKeyStore({
	task: createCrudQueries<Task>("Task"),
	user: {
		...createCrudQueries<User>("User"),
		session: {
			queryKey: null,
			queryFn: async () => {
				// Context-aware: uses useServerFn in components, raw function in loaders
				return await useContextAwareServerFn(getSessionUser)();
			},
		},
	},
});

// Type inference helpers
export type QueryKeys = inferQueryKeyStore<typeof queries>;
