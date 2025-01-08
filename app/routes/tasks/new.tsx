/**
 * Route component for task creation
 * Handles task creation mutation and redirects to task list on success
 * Protected route requiring authentication
 */

import { Card, Stack } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { showToast } from "~/components/Toast";
import type { Task, TaskStatusType } from "~/server/db/schema";
import { createTask } from "~/server/services/task-service";

type TaskFormData = {
	title: string;
	description: string | null;
	due_date: Date | null;
	status: TaskStatusType;
};

export const Route = createFileRoute("/tasks/new")({
	component: NewTask,
	loader: async ({ context }) => {
		if (!context.user) {
			throw new Error("Not authenticated");
		}
		return { userId: context.user.id };
	},
});

function NewTask() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { userId } = Route.useLoaderData();

	const createTaskMutation = useMutation({
		mutationFn: async (data: TaskFormData) => {
			const result = await createTask({ data });
			return result;
		},
		onMutate: async (newTask) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks"] });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

			// Optimistically update to the new value
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => [
				...old,
				{
					id: `temp-${Date.now()}`,
					user_id: userId,
					created_at: new Date(),
					updated_at: new Date(),
					...newTask,
				},
			]);

			// Return a context object with the snapshotted value
			return { previousTasks };
		},
		onSuccess: () => {
			showToast({
				title: "Success",
				description: "Task created successfully",
				type: "success",
			});
			navigate({ to: "/tasks" });
		},
		onError: (error, _variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks"], context.previousTasks);
			}
			showToast({
				title: "Error",
				description: error.message,
				type: "error",
			});
		},
		onSettled: () => {
			// Always refetch after error or success to ensure cache is in sync with server
			queryClient.invalidateQueries({ queryKey: ["tasks"] });
		},
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Card withBorder>
				<Stack gap="md" p="md">
					<TaskForm
						onSubmit={(values) => createTaskMutation.mutate(values)}
						isSubmitting={createTaskMutation.isPending}
					/>
				</Stack>
			</Card>
		</div>
	);
}
