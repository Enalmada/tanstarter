/**
 * Route component for task creation
 * Handles task creation mutation and redirects to task list on success
 * Protected route requiring authentication
 *
 * Mutation function order:
 * 1. mutationFn - The actual server call
 * 2. onMutate - Pre-mutation optimistic updates
 * 3. onSuccess - Post-mutation success handling
 * 4. onError - Error handling and rollback
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { showToast } from "~/components/Toast";
import { Card, Stack } from "~/components/ui";
import type { Task, TaskStatusType } from "~/server/db/schema";
import { createEntity } from "~/server/services/base-service";
import { queries } from "~/utils/query/queries";

type TaskFormData = {
	title: string;
	description: string | null;
	dueDate: Date | null;
	status: TaskStatusType;
	userId: string;
};

export const Route = createFileRoute("/tasks/new")({
	component: NewTask,
	loader: async ({ context }) => {
		return { userId: context.user?.id };
	},
});

function NewTask() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { userId } = Route.useLoaderData();

	const createTaskMutation = useMutation({
		mutationFn: async (data: TaskFormData) => {
			const result = await createEntity({
				data: {
					subject: "Task",
					data,
				},
			});
			return result;
		},
		onMutate: async (newTask) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: queries.task.list(userId).queryKey,
			});

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<Task[]>(
				queries.task.list(userId).queryKey,
			);

			// Use a consistent timestamp for optimistic updates
			const now = new Date().toISOString();

			// Create optimistic task
			const optimisticTask: Task = {
				id: `temp-${Date.now()}`,
				createdAt: new Date(now),
				updatedAt: new Date(now),
				version: 1,
				createdById: userId ?? "temp-user",
				updatedById: userId ?? "temp-user",
				...newTask,
			};

			// Optimistically update to the new value
			queryClient.setQueryData<Task[]>(
				queries.task.list(userId).queryKey,
				(old = []) => [...old, optimisticTask],
			);

			// Navigate optimistically
			navigate({ to: "/tasks" });

			// Return a context object with the snapshotted value
			return { previousTasks, optimisticTask };
		},
		onSettled: (createdTask, error, _variables, context) => {
			if (createdTask && context) {
				// Update the cache with the actual server data
				queryClient.setQueryData<Task[]>(
					queries.task.list(userId).queryKey,
					(old = []) =>
						old.map((t) =>
							t.id === context.optimisticTask.id ? (createdTask as Task) : t,
						),
				);
			}
		},
		onSuccess: (_createdTask, _variables, _context) => {
			showToast({
				title: "Success",
				description: "Task created successfully",
				type: "success",
			});
		},
		onError: (error, _variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
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
			navigate({ to: "/tasks/new" });
		},
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Card withBorder>
				<Stack gap="md" p="md">
					<TaskForm
						onSubmit={(values) => createTaskMutation.mutate(values)}
						isSubmitting={createTaskMutation.isPending}
						userId={userId ?? ""}
					/>
				</Stack>
			</Card>
		</div>
	);
}
