/**
 * Task edit route component
 * Handles task updates and manages task data fetching
 * Includes navigation back to task list and form state management
 */

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { Button, Card, Group, Stack } from "~/components/ui";
import type { Task, TaskStatusType } from "~/server/db/schema";
import {
	useDeleteEntityMutation,
	useUpdateEntityMutation,
} from "~/utils/query/mutations";
import { queries } from "~/utils/query/queries";

export type TaskFormData = {
	title: string;
	description: string | null;
	dueDate: Date | null;
	status: TaskStatusType;
	userId: string;
};

export const Route = createFileRoute("/tasks/$taskId")({
	component: EditTask,
	loader: async ({ context, params }) => {
		const userId = context.user?.id;
		await context.queryClient.ensureQueryData(
			queries.task.detail(params.taskId),
		);
		return { userId };
	},
});

function EditTask() {
	const { taskId } = Route.useParams();
	const { data: task } = useSuspenseQuery(queries.task.detail(taskId));
	const navigate = useNavigate();
	const { userId } = Route.useLoaderData();

	const updateTaskMutation = useUpdateEntityMutation<Task, TaskFormData>({
		entityName: "Task",
		entity: task,
		subject: "Task",
		listKeys: [queries.task.list(userId).queryKey],
		detailKey: queries.task.detail(task.id).queryKey,
		navigateTo: "/tasks",
		navigateBack: `/tasks/${task.id}`,
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
		listKeys: [queries.task.list(userId).queryKey],
		detailKey: queries.task.detail(task.id).queryKey,
		navigateTo: "/tasks",
		navigateBack: `/tasks/${task.id}`,
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Group justify="space-between">
				<Button variant="subtle" onClick={() => navigate({ to: "/tasks" })}>
					← Back to Tasks
				</Button>
				<Button
					color="red"
					variant="subtle"
					onClick={() => deleteTaskMutation.mutate({})}
					loading={deleteTaskMutation.isPending}
				>
					Delete Task
				</Button>
			</Group>

			<Card withBorder>
				<Stack gap="md" p="md">
					<TaskForm
						defaultValues={task}
						onSubmit={(values) =>
							updateTaskMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateTaskMutation.isPending}
						userId={userId ?? ""}
					/>
				</Stack>
			</Card>
		</div>
	);
}
