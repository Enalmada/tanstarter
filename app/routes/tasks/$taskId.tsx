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

import { Button, Card, Group, Stack } from "@mantine/core";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { showToast } from "~/components/Toast";
import type { Task, TaskStatusType } from "~/server/db/schema";
import { deleteTask, updateTask } from "~/server/services/task-service";
import { taskQueryOptions } from "~/utils/tasks";

type TaskFormData = {
	title: string;
	description: string | null;
	due_date: Date | null;
	status: TaskStatusType;
};

export const Route = createFileRoute("/tasks/$taskId")({
	component: EditTask,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(taskQueryOptions(params.taskId));
	},
});

function EditTask() {
	const { taskId } = Route.useParams();
	const { data: task } = useSuspenseQuery(taskQueryOptions(taskId));
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
			await queryClient.cancelQueries({ queryKey: ["tasks", task.id] });

			// Snapshot the previous values
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
			const previousTask = queryClient.getQueryData<Task>(["tasks", task.id]);

			// Use a consistent timestamp for optimistic updates
			const now = new Date().toISOString();

			// Create optimistic task
			const optimisticTask: Task = {
				...task,
				...newData,
				updated_at: new Date(now),
			};

			// Optimistically update both caches
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
				old.map((t) => (t.id === task.id ? optimisticTask : t)),
			);
			queryClient.setQueryData(["tasks", task.id], optimisticTask);

			// Navigate optimistically
			navigate({ to: "/tasks" });

			// Return a context object with the snapshotted values
			return { previousTasks, previousTask };
		},
		onSuccess: (updatedTask) => {
			// Update both caches with the actual server data
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
				old.map((t) => (t.id === task.id ? updatedTask : t)),
			);
			queryClient.setQueryData(["tasks", task.id], updatedTask);

			showToast({
				title: "Success",
				description: "Task updated successfully",
				type: "success",
			});
		},
		onError: (error, _variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousTask) {
				queryClient.setQueryData(["tasks", task.id], context.previousTask);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks"], context.previousTasks);
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
			await queryClient.cancelQueries({ queryKey: ["tasks", task.id] });

			// Snapshot the previous values
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
			const previousTask = queryClient.getQueryData<Task>(["tasks", task.id]);

			// Optimistically remove from both caches
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
				old.filter((t) => t.id !== task.id),
			);
			queryClient.removeQueries({ queryKey: ["tasks", task.id] });

			// Navigate optimistically
			navigate({ to: "/tasks" });

			// Return a context object with the snapshotted values
			return { previousTasks, previousTask };
		},
		onSuccess: () => {
			// The task is already removed from cache in onMutate
			showToast({
				title: "Success",
				description: "Task deleted successfully",
				type: "success",
			});
		},
		onError: (error, _variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousTask) {
				queryClient.setQueryData(["tasks", task.id], context.previousTask);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks"], context.previousTasks);
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
