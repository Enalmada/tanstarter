import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminTaskForm, type TaskFormData } from "~/components/admin/TaskForm";
import { Button, Card, Group, Stack } from "~/components/ui";
import type { Task } from "~/server/db/schema";
import {
	useDeleteEntityMutation,
	useUpdateEntityMutation,
} from "~/utils/query/mutations";
import { adminQueries } from "~/utils/query/queries";

export const Route = createFileRoute("/admin/tasks/$taskId")({
	component: AdminEditTask,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			adminQueries.adminTask.detail(params.taskId),
		);
	},
});

function AdminEditTask() {
	const { taskId } = Route.useParams();
	const { data: task } = useSuspenseQuery(
		adminQueries.adminTask.detail(taskId),
	);
	const navigate = useNavigate();

	const updateTaskMutation = useUpdateEntityMutation<Task, TaskFormData>({
		entityName: "Task",
		entity: task,
		subject: "Task",
		listKeys: [adminQueries.adminTask.list.queryKey],
		detailKey: adminQueries.adminTask.detail(task.id).queryKey,
		navigateTo: "/admin/tasks",
		navigateBack: `/admin/tasks/${task.id}`,
		createOptimisticEntity: (entity, data) => ({
			...entity,
			...data,
			version: entity.version + 1,
			updatedAt: new Date(),
		}),
	});

	const deleteTaskMutation = useDeleteEntityMutation<Task>({
		entityName: "Task",
		entityId: task.id,
		subject: "Task",
		listKeys: [adminQueries.adminTask.list.queryKey],
		detailKey: (entityId) => adminQueries.adminTask.detail(entityId).queryKey,
		navigateTo: "/admin/tasks",
		navigateBack: `/admin/tasks/${task.id}`,
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Group justify="space-between">
				<Button
					variant="subtle"
					onClick={() => navigate({ to: "/admin/tasks" })}
				>
					← Back to Tasks
				</Button>
				<Button
					variant="subtle"
					color="red"
					onClick={() => deleteTaskMutation.mutate({})}
				>
					Delete Task
				</Button>
			</Group>

			<Card withBorder>
				<Stack gap="md" p="md">
					<AdminTaskForm
						defaultValues={task}
						onSubmit={(values) =>
							updateTaskMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateTaskMutation.isPending}
					/>
				</Stack>
			</Card>
		</div>
	);
}
