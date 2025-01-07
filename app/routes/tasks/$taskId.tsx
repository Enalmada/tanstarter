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
	const { taskId, userId } = Route.useLoaderData();
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
		{ data: Partial<Task> },
		{ previousTask: Task | undefined }
	>({
		mutationFn: async (data) => {
			const result = await updateTask({ data: { taskId, ...data } });
			return result;
		},
		onMutate: async ({ data }) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			await queryClient.cancelQueries({ queryKey: ["task", taskId] });

			// Snapshot previous values
			const previousTask = queryClient.getQueryData<Task>(["task", taskId]);

			// Create optimistic task
			const optimisticTask: Task = {
				...(previousTask as Task),
				...data,
				id: `-${Date.now()}`,
			};

			// Update both the list and individual task queries
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.map((t) => (t.id === taskId ? optimisticTask : t));
			});
			queryClient.setQueryData(["task", taskId], optimisticTask);

			return { previousTask };
		},
		onError: (err, variables, context) => {
			if (context?.previousTask) {
				queryClient.setQueryData(["task", taskId], context.previousTask);
				queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
					return old.map((t) => (t.id === taskId ? context.previousTask! : t));
				});
			}
		},
		onSuccess: (updatedTask) => {
			queryClient.setQueryData(["task", taskId], updatedTask);
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.map((t) => (t.id === taskId ? updatedTask : t));
			});
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
