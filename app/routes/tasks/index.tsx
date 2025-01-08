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
import { tasksQueryOptions } from "~/utils/tasks";

export const Route = createFileRoute("/tasks/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(tasksQueryOptions());
	},
	component: TaskListPage,
	pendingComponent: TaskListSkeleton,
	errorComponent: ({ error }) => (
		<TaskListError error={error} resetErrorBoundary={() => {}} />
	),
});

function TaskListPage() {
	const { data: tasks } = useSuspenseQuery(tasksQueryOptions());
	return <TaskList tasks={tasks} />;
}
