import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminTaskForm, type TaskFormData } from "~/components/admin/TaskForm";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { Task } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
import { preloadQueries, queries, useSuspenseQueries } from "~/utils/query/queries";

function getRouteQueries(taskId: string) {
	return [queries.task.byId(taskId)] as const;
}

export const Route = createFileRoute("/admin/tasks/$taskId")({
	component: AdminEditTask,
	loader: async ({ context, params }) => {
		await preloadQueries(context.queryClient, getRouteQueries(params.taskId));
	},
});

function AdminEditTask() {
	const { taskId } = Route.useParams();
	const navigate = useNavigate();

	const [task] = useSuspenseQueries(getRouteQueries(taskId));

	const { updateMutation, deleteMutation } = useEntityMutations<Task, TaskFormData>({
		entityName: "Task",
		entity: task,
		subject: "Task",
		listKeys: [queries.task.list().queryKey],
		detailKey: (id) => queries.task.byId(id).queryKey,
		navigateTo: "/admin/tasks",
		navigateBack: `/admin/tasks/${task.id}`,
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
				<Button variant="ghost" onClick={() => navigate({ to: "/admin/tasks" })}>
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
					<AdminTaskForm
						defaultValues={task}
						onSubmit={(values) =>
							updateMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateMutation.isPending}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
