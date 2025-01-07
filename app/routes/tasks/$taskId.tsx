/**
 * Task edit route component
 * Handles task updates and manages task data fetching
 * Includes navigation back to task list and form state management
 */

import { Button, Card, CardBody } from "@nextui-org/react";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Spinner } from "~/components/Spinner";
import { TaskForm } from "~/components/TaskForm";
import type { Task } from "~/server/db/schema";
import {
	deleteTask,
	fetchTask,
	updateTask,
} from "~/server/services/task-service";

export const Route = createFileRoute("/tasks/$taskId")({
	component: TaskDetailPage,
	loader: async ({ context, params }) => {
		if (!context.user) {
			throw new Error("Not authenticated");
		}
		return { userId: context.user.id, taskId: params.taskId };
	},
});

// Loading component for the task detail
function TaskDetailSkeleton() {
	return (
		<div className="container mx-auto p-6">
			<Card className="max-w-2xl mx-auto">
				<CardBody className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">Edit Task</h1>
					</div>
					<div className="flex justify-center">
						<Spinner />
					</div>
				</CardBody>
			</Card>
		</div>
	);
}

// Error component for the task detail
function TaskDetailError({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="container mx-auto p-6">
			<Card>
				<CardBody className="text-center">
					<h3 className="text-lg font-medium text-danger mb-2">
						Error Loading Task
					</h3>
					<p className="text-small text-default-500 mb-4">{error.message}</p>
					<Button color="primary" onPress={() => resetErrorBoundary()}>
						Try Again
					</Button>
				</CardBody>
			</Card>
		</div>
	);
}

function TaskDetailPage() {
	return (
		<ErrorBoundary FallbackComponent={TaskDetailError}>
			<Suspense fallback={<TaskDetailSkeleton />}>
				<EditTask />
			</Suspense>
		</ErrorBoundary>
	);
}

function EditTask() {
	const { taskId, userId } = Route.useLoaderData();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const { data: task, isFetching } = useSuspenseQuery({
		queryKey: ["task", taskId],
		queryFn: async () => {
			try {
				const result = await fetchTask({ data: taskId });
				return result;
			} catch (error) {
				throw new Error("Failed to load task. Please try again.");
			}
		},
		staleTime: 30 * 1000, // Consider data fresh for 30 seconds
		retry: 2, // Retry failed requests twice
	});

	const updateTaskMutation = useMutation({
		mutationFn: async ({ data }: { data: Partial<Task> }) => {
			try {
				const result = await updateTask({
					data: {
						taskId,
						data,
					},
				});
				return result;
			} catch (error) {
				throw new Error("Failed to update task. Please try again.");
			}
		},
		onMutate: async ({ data }) => {
			setErrorMessage(null);
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			await queryClient.cancelQueries({ queryKey: ["task", taskId] });

			const previousTask = queryClient.getQueryData<Task>(["task", taskId]);
			const optimisticId = `-${Date.now()}`;

			const optimisticTask: Task = {
				...(previousTask as Task),
				...data,
				id: optimisticId,
			};

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
			setErrorMessage(err.message);
		},
		onSuccess: (updatedTask, _, context) => {
			navigate({ to: "/tasks" });

			queryClient.setQueryData(["task", taskId], updatedTask);
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old
					.filter((t) => t.id !== context?.optimisticId && t.id !== taskId)
					.concat(updatedTask);
			});
		},
	});

	const deleteTaskMutation = useMutation({
		mutationFn: async () => {
			try {
				await deleteTask({ data: taskId });
			} catch (error) {
				throw new Error("Failed to delete task. Please try again.");
			}
		},
		onMutate: async () => {
			setErrorMessage(null);
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			await queryClient.cancelQueries({ queryKey: ["task", taskId] });

			const previousTasks = queryClient.getQueryData<Task[]>(["tasks", userId]);

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

	return (
		<div className="container mx-auto p-6">
			{errorMessage && (
				<div className="rounded-medium bg-danger-50 p-3 text-danger text-sm mb-4">
					{errorMessage}
				</div>
			)}
			<Card className="max-w-2xl mx-auto">
				<CardBody className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold">Edit Task</h1>
							{isFetching && <Spinner />}
						</div>
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
