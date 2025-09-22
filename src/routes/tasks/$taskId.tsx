/**
 * Task edit route component - demonstrates new routeQueries pattern
 * Shows how to define queries once and use them in both loaders and components
 * with automatic useServerFn wrapping for proper error handling
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskForm, type TaskFormData } from "~/components/TaskForm";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { Task } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
import { preloadQueries, queries, useSuspenseQueries } from "~/utils/query/queries";

/**
 * Route queries definition - single source of truth
 * Used by both loader (raw) and component (useServerFn wrapped)
 */
function getRouteQueries(taskId: string) {
	return [queries.task.byId(taskId), queries.user.session] as const;
}

export const Route = createFileRoute("/tasks/$taskId")({
	component: EditTask,
	loader: async ({ context, params }) => {
		// Preload queries for server-side rendering
		await preloadQueries(context.queryClient, getRouteQueries(params.taskId));
	},
});

function EditTask() {
	const { taskId } = Route.useParams();
	const navigate = useNavigate();

	// Same queries as loader, automatically wrapped with useServerFn
	const [task, user] = useSuspenseQueries(getRouteQueries(taskId));

	const { updateMutation, deleteMutation } = useEntityMutations<Task, TaskFormData>({
		entityName: "Task",
		entity: task,
		subject: "Task",
		listKeys: [queries.task.list({ userId: user?.id }).queryKey],
		detailKey: (id) => queries.task.byId(id).queryKey,
		navigateTo: "/tasks",
		navigateBack: `/tasks/${task.id}`,
		createOptimisticEntity: (data: TaskFormData) => ({
			...task,
			...data,
			version: task.version + 1,
			updatedAt: new Date(),
		}),
	});

	return (
		<div className="container mx-auto space-y-4 p-6">
			<div className="flex justify-between items-center">
				<Button variant="ghost" onClick={() => navigate({ to: "/tasks" })}>
					← Back to Tasks
				</Button>
				<Button
					variant="destructive"
					onClick={() => deleteMutation.mutate({ entityId: task.id })}
					disabled={deleteMutation.isPending}
				>
					Delete Task
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6 space-y-4">
					<TaskForm
						defaultValues={{
							...task,
							userId: user?.id ?? "",
						}}
						onSubmit={(values) =>
							updateMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateMutation.isPending}
						userId={user?.id ?? ""}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
