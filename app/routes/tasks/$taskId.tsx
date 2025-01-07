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
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { TaskForm } from "~/components/TaskForm";
import type { Task } from "~/server/db/schema";
import {
	deleteTask,
	fetchTask,
	updateTask,
} from "~/server/services/task-service";

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
		{ previousTask: Task | undefined; optimisticId: string }
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
			const optimisticId = `-${Date.now()}`;

			// Create optimistic task
			const optimisticTask: Task = {
				...(previousTask as Task),
				...data,
				id: optimisticId,
			};

			// Update both the list and individual task queries
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.filter((t) => t.id !== taskId).concat(optimisticTask);
			});
			queryClient.setQueryData(["task", taskId], optimisticTask);

			return { previousTask, optimisticId };
		},
		onError: (err, variables, context) => {
			if (context?.previousTask) {
				queryClient.setQueryData(["task", taskId], context.previousTask);
				queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
					return old
						.filter((t) => t.id !== context.optimisticId)
						.concat(context.previousTask!);
				});
			}
		},
		onSuccess: (updatedTask, _, context) => {
			// First navigate
			navigate({ to: "/tasks" });

			// Then update the cache
			queryClient.setQueryData(["task", taskId], updatedTask);
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old
					.filter((t) => t.id !== context?.optimisticId && t.id !== taskId)
					.concat(updatedTask);
			});
		},
	});

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const deleteTaskMutation = useMutation<
		void,
		Error,
		void,
		{ previousTasks: Task[] | undefined }
	>({
		mutationFn: async () => {
			await deleteTask({ data: taskId });
		},
		onMutate: async () => {
			setErrorMessage(null);
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			await queryClient.cancelQueries({ queryKey: ["task", taskId] });

			const previousTasks = queryClient.getQueryData<Task[]>(["tasks", userId]);

			// Remove from both caches
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.filter((t) => t.id !== taskId);
			});
			queryClient.removeQueries({ queryKey: ["task", taskId] });

			return { previousTasks };
		},
		onError: (err, variables, context) => {
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks", userId], context.previousTasks);
			}
			setErrorMessage(err.message);
		},
		onSuccess: () => {
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

					{!task.id.startsWith("-") && (
						<Button
							color="danger"
							variant="flat"
							onPress={() => deleteTaskMutation.mutate()}
							isDisabled={deleteTaskMutation.isPending}
							className="self-start"
							startContent={<Trash2 size={20} />}
						>
							Delete Task
						</Button>
					)}
				</CardBody>
			</Card>
		</div>
	);
}
