/**
 * Main task list route component
 * Displays all tasks with completion toggle functionality
 * Includes task creation link and handles task status updates
 */

import { createFileRoute, type ErrorComponentProps } from "@tanstack/react-router";
import { TaskList } from "~/components/tasks/TaskList";
import { TaskListError } from "~/components/tasks/TaskListError";
import { TaskListSkeleton } from "~/components/tasks/TaskListSkeleton";
import { useReportError } from "~/lib/monitoring/report";
import { preloadQueries, queries, useSuspenseQueries } from "~/utils/query/queries";

function getRouteQueries(userId?: string) {
	return [queries.task.list({ userId })] as const;
}

export const Route = createFileRoute("/_authed/tasks/")({
	loader: async ({ context }) => {
		const userId = context.user.id;
		await preloadQueries(context.queryClient, getRouteQueries(userId));
		return { userId };
	},
	component: TaskListPage,
	pendingComponent: TaskListSkeleton,
	errorComponent: TasksError,
});

function TasksError({ error }: ErrorComponentProps) {
	useReportError(error, "router:/tasks");
	return <TaskListError error={error} resetErrorBoundary={() => {}} />;
}

function TaskListPage() {
	const { userId } = Route.useLoaderData();
	const [tasks] = useSuspenseQueries(getRouteQueries(userId));
	return <TaskList userId={userId || undefined} tasks={tasks} />;
}
