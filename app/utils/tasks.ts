/**
 * Task Query and Mutation Patterns
 *
 * Requirements for all data operations:
 *
 * 1. SSR & Hydration
 * - Use ensureQueryData in loaders for SSR prefetching
 * - Use useSuspenseQuery in components for hydration
 * - Avoid loading indicators on first render
 *
 * 2. Query Patterns
 * - Consistent query keys: ["tasks"] for list, ["tasks", taskId] for details
 * - Suspense enabled for loading states
 * - Error boundaries for error handling
 *
 * 3. Mutation Requirements
 * - Cancel in-flight queries before mutations (queryClient.cancelQueries)
 * - Implement optimistic updates for immediate UI feedback
 * - Snapshot previous state for rollbacks
 * - Handle errors with cache restoration
 * - Update all related queries on success
 *
 * 4. Cache Management
 * - Direct cache updates (no invalidation)
 * - Maintain consistency across list and detail views
 * - Handle race conditions with cancellation
 * - Clean up detail queries on deletion
 *
 * Example mutation pattern:
 * ```typescript
 * onMutate: async () => {
 *   // 1. Cancel in-flight queries
 *   await queryClient.cancelQueries(["tasks"]);
 *
 *   // 2. Snapshot current state
 *   const previousData = queryClient.getQueryData(["tasks"]);
 *
 *   // 3. Optimistic update
 *   queryClient.setQueryData(["tasks"], optimisticValue);
 *
 *   // 4. Return snapshot for rollback
 *   return { previousData };
 * }
 * ```
 */

import { queryOptions } from "@tanstack/react-query";
import { fetchTask, fetchTasks } from "~/server/services/task-service";

// 5 minutes stale time to match QueryClient defaults
const STALE_TIME = 1000 * 60 * 5;

export const tasksQueryOptions = () =>
	queryOptions({
		queryKey: ["tasks"],
		queryFn: () => fetchTasks({}),
		staleTime: STALE_TIME,
	});

export const taskQueryOptions = (taskId: string) =>
	queryOptions({
		queryKey: ["tasks", taskId],
		queryFn: () => fetchTask({ data: taskId }),
		staleTime: STALE_TIME,
	});
