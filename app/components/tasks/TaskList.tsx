import { Button, Card, CardBody, Checkbox } from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { type Task, TaskStatus } from "~/server/db/schema";
import { deleteTask, updateTask } from "~/server/services/task-service";
import { taskQueryOptions } from "~/utils/tasks";

export function TaskList({ tasks }: { tasks: Task[] }) {
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState("");
	const [isPending, startTransition] = useTransition();

	// Add prefetch function with error handling
	const prefetchTask = (taskId: string) => {
		startTransition(() => {
			queryClient.prefetchQuery(taskQueryOptions(taskId));
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
					data,
				},
			});
			return result;
		},
		onMutate: async ({ taskId, data, currentTask }) => {
			setErrorMessage("");

			// Cancel any outgoing refetches so they don't overwrite our optimistic update
			await queryClient.cancelQueries({ queryKey: ["tasks"] });
			await queryClient.cancelQueries({ queryKey: ["tasks", taskId] });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
			const previousTask = queryClient.getQueryData<Task>(["tasks", taskId]);

			// Create optimistic task
			const optimisticTask: Task = {
				...currentTask,
				...data,
			};

			// Optimistically update the lists
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.map((t) => (t.id === taskId ? optimisticTask : t));
			});
			queryClient.setQueryData(["tasks", taskId], optimisticTask);

			return { previousTasks, previousTask };
		},
		onError: (err, { taskId }, context) => {
			// Revert both caches on error
			if (context?.previousTask) {
				queryClient.setQueryData(["tasks", taskId], context.previousTask);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks"], context.previousTasks);
			}
			setErrorMessage(err.message);
		},
		onSuccess: (updatedTask, { taskId }) => {
			// Update both caches with server data
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.map((t) => (t.id === taskId ? updatedTask : t));
			});
			queryClient.setQueryData(["tasks", taskId], updatedTask);
		},
	});

	const deleteTaskMutation = useMutation({
		mutationFn: async ({ taskId }: { taskId: string }) => {
			await deleteTask({ data: taskId });
			return taskId;
		},
		onMutate: async ({ taskId }) => {
			setErrorMessage("");

			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks"] });
			await queryClient.cancelQueries({ queryKey: ["tasks", taskId] });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
			const previousTask = queryClient.getQueryData<Task>(["tasks", taskId]);

			// Optimistically remove from lists
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.filter((t) => t.id !== taskId);
			});
			queryClient.removeQueries({ queryKey: ["tasks", taskId] });

			return { previousTasks, previousTask, taskId };
		},
		onError: (err, { taskId }, context) => {
			// Revert both caches on error
			if (context?.previousTask) {
				queryClient.setQueryData(["tasks", taskId], context.previousTask);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks"], context.previousTasks);
			}
			setErrorMessage(err.message);
		},
		onSuccess: (taskId) => {
			// Remove from cache on success (already done optimistically)
			queryClient.removeQueries({ queryKey: ["tasks", taskId] });
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
											title: task.title,
											description: task.description,
											due_date: task.due_date,
											status:
												task.status === TaskStatus.ACTIVE
													? TaskStatus.COMPLETED
													: TaskStatus.ACTIVE,
										},
									})
								}
								isDisabled={
									task.id.startsWith("-") || updateTaskMutation.isPending
								}
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
									task.id.startsWith("-") ||
									updateTaskMutation.isPending ||
									deleteTaskMutation.isPending
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
