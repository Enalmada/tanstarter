/**
 * Task edit route component
 * Handles task updates and manages task data fetching
 * Includes navigation back to task list and form state management
 *
 * Mutation function order:
 * 1. mutationFn - The actual server call
 * 2. onMutate - Pre-mutation optimistic updates
 * 3. onSuccess - Post-mutation success handling
 * 4. onError - Error handling and rollback
 */

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { showToast } from "~/components/Toast";
import { Button, Card, Group, Stack } from "~/components/ui";
import type { Task, TaskStatusType } from "~/server/db/schema";
import { updateEntity } from "~/server/services/base-service";
import { useDeleteEntityMutation } from "~/utils/query/mutations";
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
	const queryClient = useQueryClient();
	const { userId } = Route.useLoaderData();

	const updateTaskMutation = useMutation({
		mutationFn: async (data: TaskFormData) => {
			const result = await updateEntity({
				data: {
					id: task.id,
					subject: "Task",
					data: {
						...data,
						version: task.version,
					},
				},
			});
			return result as Task;
		},
		onMutate: async (newData) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: [
					queries.task.list(userId).queryKey,
					queries.task.detail(task.id).queryKey,
				],
			});

			// Snapshot the previous values
			const previousTasks = queryClient.getQueryData<Task[]>(
				queries.task.list(userId).queryKey,
			);
			const previousTask = queryClient.getQueryData<Task>(
				queries.task.detail(task.id).queryKey,
			);

			// Use a consistent timestamp for optimistic updates
			const now = new Date().toISOString();

			// Create optimistic task
			const optimisticTask: Task = {
				...task,
				...newData,
				version: task.version + 1,
				updatedAt: new Date(now),
			};

			// Optimistically update both caches
			queryClient.setQueryData<Task[]>(
				queries.task.list(userId).queryKey,
				(old = []) => old.map((t) => (t.id === task.id ? optimisticTask : t)),
			);
			queryClient.setQueryData(
				queries.task.detail(task.id).queryKey,
				optimisticTask,
			);

			// Navigate optimistically
			navigate({ to: "/tasks" });

			// Return a context object with the snapshotted values
			return { previousTasks, previousTask };
		},
		onSettled: (updatedTask, error, _variables, context) => {
			if (updatedTask && context) {
				// Update both caches with the actual server data
				queryClient.setQueryData<Task[]>(
					queries.task.list(userId).queryKey,
					(old = []) =>
						old.map((t) => (t.id === task.id ? (updatedTask as Task) : t)),
				);
				queryClient.setQueryData(
					queries.task.detail(task.id).queryKey,
					updatedTask,
				);
			}
		},
		onSuccess: (_updatedTask) => {
			showToast({
				title: "Success",
				description: "Task updated successfully",
				type: "success",
			});
		},
		onError: (error, _variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousTask) {
				queryClient.setQueryData(
					queries.task.detail(task.id).queryKey,
					context.previousTask,
				);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(
					queries.task.list(userId).queryKey,
					context.previousTasks,
				);
			}
			showToast({
				title: "Error",
				description: error.message,
				type: "error",
			});
			// Navigate back to the form on error
			navigate({ to: `/tasks/${task.id}` });
		},
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
						onSubmit={(values) => updateTaskMutation.mutate(values)}
						isSubmitting={updateTaskMutation.isPending}
						userId={userId ?? ""}
					/>
				</Stack>
			</Card>
		</div>
	);
}
