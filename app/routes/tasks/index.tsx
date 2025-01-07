/**
 * Main task list route component
 * Displays all tasks with completion toggle functionality
 * Includes task creation link and handles task status updates
 */

import { Button, Card, CardBody, Checkbox } from "@nextui-org/react";
import {
	QueryClient,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Suspense, useState, useTransition } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Spinner } from "~/components/Spinner";
import { type Task, TaskStatus } from "~/server/db/schema";
import {
	deleteTask,
	fetchTask,
	fetchTasks,
	updateTask,
} from "~/server/services/task-service";

export const Route = createFileRoute("/tasks/")({
	component: TaskListPage,
	loader: async ({ context }) => {
		if (!context.user) {
			throw new Error("Not authenticated");
		}
		return { userId: context.user.id };
	},
});

// Loading component for the task list
function TaskListSkeleton() {
	return (
		<div className="container mx-auto p-6">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">Tasks</h1>
				<Button
					as={Link}
					to="/tasks/new"
					color="primary"
					variant="solid"
					size="lg"
				>
					New Task
				</Button>
			</div>
			<div className="flex justify-center">
				<Spinner />
			</div>
		</div>
	);
}

// Error component for the task list
function TaskListError({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="container mx-auto p-6">
			<Card>
				<CardBody className="text-center">
					<h3 className="text-lg font-medium text-danger mb-2">
						Error Loading Tasks
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

function TaskListPage() {
	return (
		<ErrorBoundary FallbackComponent={TaskListError}>
			<Suspense fallback={<TaskListSkeleton />}>
				<TaskList />
			</Suspense>
		</ErrorBoundary>
	);
}

function TaskList() {
	const { userId } = Route.useLoaderData();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState("");
	const [isPending, startTransition] = useTransition();

	const { data: tasks = [], isFetching } = useSuspenseQuery({
		queryKey: ["tasks", userId],
		queryFn: async () => {
			try {
				const result = await fetchTasks({});
				return result;
			} catch (error) {
				throw new Error("Failed to load tasks. Please try again.");
			}
		},
		staleTime: 30 * 1000, // Consider data fresh for 30 seconds
		retry: 2, // Retry failed requests twice
	});

	// Add prefetch function with error handling
	const prefetchTask = (taskId: string) => {
		startTransition(() => {
			queryClient.prefetchQuery({
				queryKey: ["task", taskId],
				queryFn: async () => {
					try {
						const result = await fetchTask({ data: taskId });
						return result;
					} catch (error) {
						console.error("Prefetch failed:", error);
						return null;
					}
				},
				staleTime: 30 * 1000,
			});
		});
	};

	const updateTaskMutation = useMutation({
		mutationFn: async ({
			taskId,
			data,
			currentTask,
		}: {
			taskId: string;
			data: Partial<Task>;
			currentTask: Task;
		}) => {
			const result = await updateTask({
				data: {
					taskId,
					data: {
						title: currentTask.title,
						description: currentTask.description,
						due_date: currentTask.due_date,
						...data,
					},
				},
			});
			return result;
		},
		onMutate: async ({ taskId, data }) => {
			setErrorMessage("");
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });

			const previousTasks = queryClient.getQueryData<Task[]>(["tasks", userId]);

			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.map((task) =>
					task.id === taskId ? { ...task, ...data } : task,
				);
			});

			return { previousTasks };
		},
		onError: (err, variables, context) => {
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks", userId], context.previousTasks);
			}
			setErrorMessage(err.message);
		},
		onSuccess: (updatedTask, { taskId }) => {
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.map((task) => (task.id === taskId ? updatedTask : task));
			});
		},
	});

	const deleteTaskMutation = useMutation({
		mutationFn: async ({ taskId }: { taskId: string }) => {
			await deleteTask({ data: taskId });
		},
		onMutate: async ({ taskId }) => {
			setErrorMessage("");
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });

			const previousTasks = queryClient.getQueryData<Task[]>(["tasks", userId]);

			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.filter((t) => t.id !== taskId);
			});

			return { previousTasks };
		},
		onError: (err, variables, context) => {
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks", userId], context.previousTasks);
			}
			setErrorMessage(err.message);
		},
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			{errorMessage && (
				<div className="rounded-medium bg-danger-50 p-3 text-danger text-sm">
					{errorMessage}
				</div>
			)}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-bold">Tasks</h1>
					{isFetching && <Spinner />}
				</div>
				<Button
					as={Link}
					to="/tasks/new"
					color="primary"
					variant="solid"
					size="lg"
				>
					New Task
				</Button>
			</div>

			<div className="grid gap-4">
				{tasks.map((task: Task) => (
					<Card key={task.id} className="w-full">
						<CardBody className="flex flex-row items-center gap-4">
							<Checkbox
								isSelected={task.status === TaskStatus.COMPLETED}
								onValueChange={() =>
									updateTaskMutation.mutate({
										taskId: task.id,
										currentTask: task,
										data: {
											status:
												task.status === TaskStatus.ACTIVE
													? TaskStatus.COMPLETED
													: TaskStatus.ACTIVE,
										},
									})
								}
								isDisabled={task.id.startsWith("-")}
							/>
							<div className="flex flex-col gap-1 flex-1">
								<Link
									to="/tasks/$taskId"
									params={{ taskId: task.id }}
									className={`${
										task.status === TaskStatus.COMPLETED
											? "text-default-400 line-through"
											: ""
									} ${task.id.startsWith("-") ? "pointer-events-none opacity-50" : ""}`}
									onMouseEnter={() => {
										if (!task.id.startsWith("-")) {
											prefetchTask(task.id);
										}
									}}
								>
									<h3 className="text-lg font-medium">{task.title}</h3>
								</Link>
								{task.description && (
									<p className="text-small text-default-500">
										{task.description}
									</p>
								)}
								{task.due_date && (
									<p className="text-tiny text-default-400">
										Due: {new Date(task.due_date).toLocaleDateString()}
									</p>
								)}
							</div>
							<Button
								isIconOnly
								variant="light"
								onPress={() => deleteTaskMutation.mutate({ taskId: task.id })}
								isDisabled={
									task.id.startsWith("-") || updateTaskMutation.isPending
								}
								className="text-danger"
							>
								<Trash2 size={20} />
							</Button>
						</CardBody>
					</Card>
				))}

				{tasks.length === 0 && (
					<Card>
						<CardBody className="text-center text-default-500">
							No tasks yet. Create one to get started!
						</CardBody>
					</Card>
				)}
			</div>
		</div>
	);
}
