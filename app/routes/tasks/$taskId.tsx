/**
 * Task edit route component
 * Handles task updates and manages task data fetching
 * Includes navigation back to task list and form state management
 */

import { Button, Card, Group, Stack } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { showToast } from "~/components/Toast";
import type { Task, TaskStatusType } from "~/server/db/schema";
import {
	deleteTask,
	fetchTask,
	updateTask,
} from "~/server/services/task-service";

type TaskFormData = {
	title: string;
	description: string | null;
	due_date: Date | null;
	status: TaskStatusType;
};

export const Route = createFileRoute("/tasks/$taskId")({
	component: EditTask,
	loader: async ({ context, params }) => {
		if (!context.user) {
			throw redirect({ to: "/signin" });
		}
		const task = await fetchTask({ data: params.taskId });
		if (!task) {
			throw new Error("Task not found");
		}
		return { task };
	},
});

function EditTask() {
	const { task } = Route.useLoaderData();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const updateTaskMutation = useMutation({
		mutationFn: async (data: TaskFormData) => {
			const result = await updateTask({
				data: {
					taskId: task.id,
					data,
				},
			});
			return result;
		},
		onMutate: async (newData) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks"] });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

			// Optimistically update to the new value
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
				old.map((t) =>
					t.id === task.id
						? {
								...t,
								...newData,
								updated_at: new Date(),
							}
						: t,
				),
			);

			// Return a context object with the snapshotted value
			return { previousTasks };
		},
		onSuccess: () => {
			showToast({
				title: "Success",
				description: "Task updated successfully",
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

	const deleteTaskMutation = useMutation({
		mutationFn: async () => {
			const result = await deleteTask({
				data: task.id,
			});
			return result;
		},
		onMutate: async () => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks"] });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

			// Optimistically update to the new value
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
				old.filter((t) => t.id !== task.id),
			);

			// Return a context object with the snapshotted value
			return { previousTasks };
		},
		onSuccess: () => {
			showToast({
				title: "Success",
				description: "Task deleted successfully",
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
			<Group justify="space-between">
				<Button variant="subtle" onClick={() => navigate({ to: "/tasks" })}>
					← Back to Tasks
				</Button>
				<Button
					color="red"
					variant="subtle"
					onClick={() => deleteTaskMutation.mutate()}
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
					/>
				</Stack>
			</Card>
		</div>
	);
}
