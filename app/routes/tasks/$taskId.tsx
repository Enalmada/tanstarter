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
import { useState } from "react";
import type { FallbackProps } from "react-error-boundary";
import { Spinner } from "~/components/Spinner";
import { TaskForm } from "~/components/TaskForm";
import type { Task } from "~/server/db/schema";
import {
	deleteTask,
	fetchTask,
	updateTask,
} from "~/server/services/task-service";
import { taskQueryOptions } from "~/utils/tasks";

export const Route = createFileRoute("/tasks/$taskId")({
	loader: async ({ context, params: { taskId } }) => {
		await context.queryClient.ensureQueryData(taskQueryOptions(taskId));
	},
	component: TaskDetailPage,
	pendingComponent: TaskDetailSkeleton,
	errorComponent: ({ error }) => (
		<TaskDetailError error={error} resetErrorBoundary={() => {}} />
	),
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
	const { taskId } = Route.useParams();
	const { data: task } = useSuspenseQuery(taskQueryOptions(taskId));
	return <EditTask task={task} taskId={taskId} />;
}

function EditTask({ task, taskId }: { task: Task; taskId: string }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const updateTaskMutation = useMutation({
		mutationFn: async ({ data }: { data: Partial<Task> }) => {
			const result = await updateTask({
				data: {
					taskId,
					data,
				},
			});
			return result;
		},
		onMutate: async ({ data }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks"] });
			await queryClient.cancelQueries({ queryKey: ["tasks", taskId] });

			// Snapshot current state
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
			const previousTask = queryClient.getQueryData<Task>(["tasks", taskId]);

			// Create optimistic task
			const optimisticTask: Task = {
				...task,
				...data,
			};

			// Update both caches optimistically
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.map((t) => (t.id === taskId ? optimisticTask : t));
			});
			queryClient.setQueryData(["tasks", taskId], optimisticTask);

			return { previousTasks, previousTask };
		},
		onError: (err, variables, context) => {
			// Revert both caches on error
			if (context?.previousTask) {
				queryClient.setQueryData(["tasks", taskId], context.previousTask);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks"], context.previousTasks);
			}
			setErrorMessage(err.message);
		},
		onSuccess: (updatedTask) => {
			// Update both caches with server data
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.map((t) => (t.id === taskId ? updatedTask : t));
			});
			queryClient.setQueryData(["tasks", taskId], updatedTask);
			navigate({ to: "/tasks" });
		},
	});

	const deleteTaskMutation = useMutation({
		mutationFn: async () => {
			await deleteTask({ data: taskId });
			return taskId;
		},
		onMutate: async () => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks"] });
			await queryClient.cancelQueries({ queryKey: ["tasks", taskId] });

			// Snapshot current state
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
			const previousTask = queryClient.getQueryData<Task>(["tasks", taskId]);

			// Remove from both caches optimistically
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.filter((t) => t.id !== taskId);
			});
			queryClient.removeQueries({ queryKey: ["tasks", taskId] });

			return { previousTasks, previousTask };
		},
		onError: (err, variables, context) => {
			// Revert both caches on error
			if (context?.previousTask) {
				queryClient.setQueryData(["tasks", taskId], context.previousTask);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks"], context.previousTasks);
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
