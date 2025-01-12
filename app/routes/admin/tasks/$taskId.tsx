import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { showToast } from "~/components/Toast";
import { AdminTaskForm, type TaskFormData } from "~/components/admin/TaskForm";
import { Button, Card, Group, Stack } from "~/components/ui";
import type { Task } from "~/server/db/schema";
import {
	adminTaskService,
	clientTaskService,
} from "~/server/services/task-service";
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
	const queryClient = useQueryClient();

	const updateTaskMutation = useMutation({
		mutationFn: async (data: TaskFormData) => {
			const result = await adminTaskService.updateTask({
				data: {
					id: task.id,
					data,
				},
			});
			return result;
		},
		onMutate: async (newData) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: [
					adminQueries.adminTask.list.queryKey,
					adminQueries.adminTask.detail(task.id).queryKey,
				],
			});

			// Snapshot the previous values
			const previousTasks = queryClient.getQueryData<Task[]>(
				adminQueries.adminTask.list.queryKey,
			);
			const previousTask = queryClient.getQueryData<Task>(
				adminQueries.adminTask.detail(task.id).queryKey,
			);

			// Use a consistent timestamp for optimistic updates
			const now = new Date().toISOString();

			// Create optimistic task
			const optimisticTask: Task = {
				...task,
				...newData,
				updated_at: new Date(now),
			};

			// Optimistically update both caches
			queryClient.setQueryData<Task[]>(
				adminQueries.adminTask.list.queryKey,
				(old = []) => old.map((t) => (t.id === task.id ? optimisticTask : t)),
			);
			queryClient.setQueryData(
				adminQueries.adminTask.detail(task.id).queryKey,
				optimisticTask,
			);

			// Navigate optimistically
			navigate({ to: "/admin/tasks" });

			// Return a context object with the snapshotted values
			return { previousTasks, previousTask };
		},
		onSettled: (updatedTask, error, _variables, context) => {
			if (updatedTask && context) {
				// Update both caches with the actual server data
				queryClient.setQueryData<Task[]>(
					adminQueries.adminTask.list.queryKey,
					(old = []) => old.map((t) => (t.id === task.id ? updatedTask : t)),
				);
				queryClient.setQueryData(
					adminQueries.adminTask.detail(task.id).queryKey,
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
					adminQueries.adminTask.detail(task.id).queryKey,
					context.previousTask,
				);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(
					adminQueries.adminTask.list.queryKey,
					context.previousTasks,
				);
			}
			showToast({
				title: "Error",
				description: error.message,
				type: "error",
			});
			// Navigate back to the form on error
			navigate({ to: `/admin/tasks/${task.id}` });
		},
	});

	const deleteTaskMutation = useMutation({
		mutationFn: async () => {
			const result = await clientTaskService.deleteTask({
				data: { id: task.id },
			});
			return result;
		},
		onMutate: async () => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: [
					adminQueries.adminTask.list.queryKey,
					adminQueries.adminTask.detail(task.id).queryKey,
				],
			});

			// Snapshot the previous values
			const previousTasks = queryClient.getQueryData<Task[]>(
				adminQueries.adminTask.list.queryKey,
			);
			const previousTask = queryClient.getQueryData<Task>(
				adminQueries.adminTask.detail(task.id).queryKey,
			);

			// Optimistically remove from both caches
			queryClient.setQueryData<Task[]>(
				adminQueries.adminTask.list.queryKey,
				(old = []) => old.filter((t) => t.id !== task.id),
			);
			queryClient.removeQueries({
				queryKey: adminQueries.adminTask.detail(task.id).queryKey,
			});

			// Navigate optimistically
			navigate({ to: "/admin/tasks" });

			// Return a context object with the snapshotted values
			return { previousTasks, previousTask };
		},
		onSettled: (_result, error, _variables, context) => {
			if ((!error && context) || error?.message === "Task not found") {
				// Ensure the task is removed from both caches
				// Also remove if we got "Task not found" as it means it's already gone
				queryClient.setQueryData<Task[]>(
					adminQueries.adminTask.list.queryKey,
					(old = []) => old.filter((t) => t.id !== task.id),
				);
				queryClient.removeQueries({
					queryKey: adminQueries.adminTask.detail(task.id).queryKey,
				});
			}
		},
		onSuccess: () => {
			showToast({
				title: "Success",
				description: "Task deleted successfully",
				type: "success",
			});
		},
		onError: (error, _variables, context) => {
			// If task is not found, treat it as a success case
			if (error.message === "Task not found") {
				showToast({
					title: "Success",
					description: "Task deleted successfully",
					type: "success",
				});
				return;
			}

			// For other errors, revert both caches and show error
			if (context?.previousTask) {
				queryClient.setQueryData(
					adminQueries.adminTask.detail(task.id).queryKey,
					context.previousTask,
				);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(
					adminQueries.adminTask.list.queryKey,
					context.previousTasks,
				);
			}
			showToast({
				title: "Error",
				description: error.message,
				type: "error",
			});
			// Navigate back to the form on error
			navigate({ to: `/admin/tasks/${task.id}` });
		},
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
					<AdminTaskForm
						defaultValues={task}
						onSubmit={(values) => updateTaskMutation.mutate(values)}
						isSubmitting={updateTaskMutation.isPending}
					/>
				</Stack>
			</Card>
		</div>
	);
}
