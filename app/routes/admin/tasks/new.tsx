import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { showToast } from "~/components/Toast";
import { AdminTaskForm, type TaskFormData } from "~/components/admin/TaskForm";
import { Button, Card, Group, Stack } from "~/components/ui";
import type { Task } from "~/server/db/schema";
import { createEntity } from "~/server/services/base-service";
import { adminQueries } from "~/utils/query/queries";

export const Route = createFileRoute("/admin/tasks/new")({
	component: AdminNewTask,
	loader: async ({ context }) => {
		return { userId: context.user?.id };
	},
});

function AdminNewTask() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { userId } = Route.useLoaderData();

	const createTaskMutation = useMutation({
		mutationFn: async (data: TaskFormData) => {
			const result = await createEntity({ data: { subject: "Task", data } });
			return result;
		},
		onMutate: async (newTask) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: adminQueries.adminTask.list.queryKey,
			});

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<Task[]>(
				adminQueries.adminTask.list.queryKey,
			);

			// Use a consistent timestamp for optimistic updates
			const now = new Date().toISOString();

			// Create optimistic task
			const optimisticTask: Task = {
				...newTask,
				id: `temp-${Date.now()}`,
				createdAt: new Date(now),
				updatedAt: new Date(now),
				version: 1,
				createdById: userId ?? "",
				updatedById: userId ?? "",
			};

			// Optimistically update to the new value
			queryClient.setQueryData<Task[]>(
				adminQueries.adminTask.list.queryKey,
				(old = []) => [...old, optimisticTask],
			);

			// Navigate optimistically
			navigate({ to: "/admin/tasks" });
			// Return a context object with the snapshotted value
			return { previousTasks, optimisticTask };
		},
		onSettled: (createdTask, error, _variables, context) => {
			if (createdTask && context) {
				// Update the list cache with the actual server data
				queryClient.setQueryData<Task[]>(
					adminQueries.adminTask.list.queryKey,
					(old = []) =>
						old.map((t) =>
							t.id === context.optimisticTask.id ? (createdTask as Task) : t,
						),
				);

				// Also set the detail cache for the new task
				queryClient.setQueryData(
					adminQueries.adminTask.detail(createdTask.id).queryKey,
					createdTask,
				);
			}
		},
		onSuccess: () => {
			showToast({
				title: "Success",
				description: "Task created successfully",
				type: "success",
			});
		},
		onError: (error, _variables, context) => {
			// Revert cache on error
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
			navigate({ to: "/admin/tasks/new" });
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
			</Group>

			<Card withBorder>
				<Stack gap="md" p="md">
					<AdminTaskForm
						onSubmit={(values) => createTaskMutation.mutate(values)}
						isSubmitting={createTaskMutation.isPending}
					/>
				</Stack>
			</Card>
		</div>
	);
}
