/**
 * Task edit route component
 * Handles task updates and manages task data fetching
 * Includes navigation back to task list and form state management
 */

import { Button, Card, CardBody } from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import type { Task } from "~/server/db/schema";
import { fetchTask, updateTask } from "~/server/services/task-service";

export const Route = createFileRoute("/tasks/$taskId")({
	component: EditTask,
	loader: async ({ context, params }) => {
		if (!context.user) {
			throw new Error("Not authenticated");
		}
		return { userId: context.user.id, taskId: params.taskId };
	},
});

function EditTask() {
	const { taskId } = Route.useLoaderData();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const router = useRouter();

	const { data: task, isLoading } = useQuery({
		queryKey: ["task", taskId],
		queryFn: async () => {
			const result = await fetchTask({ data: taskId });
			return result;
		},
	});

	const updateTaskMutation = useMutation<
		Task,
		Error,
		{ taskId: string; data: Partial<Task> }
	>({
		mutationFn: async (data) => {
			const result = await updateTask({ data });
			return result;
		},
		onSuccess: async (updatedTask) => {
			// Invalidate both React Query and Router caches
			queryClient.invalidateQueries({ queryKey: ["tasks"] });
			queryClient.invalidateQueries({ queryKey: ["task", taskId] });
			queryClient.setQueryData(["task", taskId], updatedTask);
			await router.invalidate();
			navigate({ to: "/tasks" });
		},
	});

	if (isLoading || !task) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<Card className="max-w-2xl mx-auto">
				<CardBody className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">Edit Task</h1>
						<Button
							color="primary"
							variant="light"
							onPress={() => navigate({ to: "/tasks" })}
						>
							Back to Tasks
						</Button>
					</div>

					<TaskForm
						defaultValues={task}
						onSubmit={(values) =>
							updateTaskMutation.mutate({
								taskId,
								data: {
									title: values.title,
									description: values.description,
									due_date: values.due_date,
									status: values.status,
								},
							})
						}
						isSubmitting={updateTaskMutation.isPending}
					/>
				</CardBody>
			</Card>
		</div>
	);
}
