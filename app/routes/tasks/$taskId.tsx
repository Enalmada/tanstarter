/**
 * Task edit route component
 * Handles task updates and manages task data fetching
 * Includes navigation back to task list and form state management
 */

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Group } from "~/components/ui/Group";
import { Stack } from "~/components/ui/Stack";
import type { Task, TaskStatusType } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
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
		await context.queryClient.ensureQueryData(queries.task.byId(params.taskId));
		return { userId };
	},
});

function EditTask() {
	const { taskId } = Route.useParams();
	const { data: task } = useSuspenseQuery(queries.task.byId(taskId));
	const navigate = useNavigate();
	const { userId } = Route.useLoaderData();

	const { updateMutation, deleteMutation } = useEntityMutations<
		Task,
		TaskFormData
	>({
		entityName: "Task",
		entity: task,
		subject: "Task",
		listKeys: [queries.task.list({ userId }).queryKey],
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
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Group justify="space-between">
				<Button variant="subtle" onClick={() => navigate({ to: "/tasks" })}>
					← Back to Tasks
				</Button>
				<Button
					color="red"
					variant="subtle"
					onClick={() => deleteMutation.mutate({ entityId: task.id })}
					loading={deleteMutation.isPending}
				>
					Delete Task
				</Button>
			</Group>

			<Card withBorder>
				<Stack gap="md" p="md">
					<TaskForm
						defaultValues={task}
						onSubmit={(values) =>
							updateMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateMutation.isPending}
						userId={userId ?? ""}
					/>
				</Stack>
			</Card>
		</div>
	);
}
