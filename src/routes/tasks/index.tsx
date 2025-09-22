/**
 * Main task list route component
 * Displays all tasks with completion toggle functionality
 * Includes task creation link and handles task status updates
 */

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TaskList } from "~/components/tasks/TaskList";
import { TaskListError } from "~/components/tasks/TaskListError";
import { TaskListSkeleton } from "~/components/tasks/TaskListSkeleton";
import { queries } from "~/utils/query/queries";

export const Route = createFileRoute("/tasks/")({
	loader: async ({ context }) => {
		const userId = context.user?.id;
		// @ts-expect-error - React Query type conflicts from version mismatches
		await context.queryClient.ensureQueryData(queries.task.list({ userId }));
		return { userId };
	},
	component: TaskListPage,
	pendingComponent: TaskListSkeleton,
	errorComponent: ({ error }) => (
		<TaskListError error={error} resetErrorBoundary={() => {}} />
	),
});

function TaskListPage() {
	const { userId } = Route.useLoaderData();
	// @ts-expect-error - React Query type conflicts from version mismatches
	const { data: tasks } = useSuspenseQuery(queries.task.list({ userId }));
	return <TaskList userId={userId || undefined} tasks={tasks} />;
}
