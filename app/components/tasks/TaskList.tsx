import {
	Alert,
	Button,
	Card,
	Checkbox,
	Group,
	Stack,
	Text,
} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { type Task, TaskStatus } from "~/server/db/schema";
import { deleteTask, updateTask } from "~/server/services/task-service";

export function TaskList({ tasks }: { tasks: Task[] }) {
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState("");
	const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
			setPendingTaskId(taskId);

			// Cancel any outgoing refetches so they don't overwrite our optimistic update
			await queryClient.cancelQueries({ queryKey: ["tasks"] });
			await queryClient.cancelQueries({ queryKey: ["tasks", taskId] });

			// Snapshot the previous values
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
			const previousTask = queryClient.getQueryData<Task>(["tasks", taskId]);

			// Create optimistic task
			const optimisticTask: Task = {
				...currentTask,
				...data,
				updated_at: new Date(),
			};

			// Optimistically update both caches
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.map((t) => (t.id === taskId ? optimisticTask : t));
			});
			queryClient.setQueryData(["tasks", taskId], optimisticTask);

			return { previousTasks, previousTask };
		},
		onSuccess: (updatedTask, { taskId }) => {
			// Update both caches with the actual server data
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.map((t) => (t.id === taskId ? updatedTask : t));
			});
			queryClient.setQueryData(["tasks", taskId], updatedTask);
			setPendingTaskId(null);
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
			setPendingTaskId(null);
		},
	});

	const deleteTaskMutation = useMutation({
		mutationFn: async ({ taskId }: { taskId: string }) => {
			const result = await deleteTask({ data: taskId });
			return taskId;
		},
		onMutate: async ({ taskId }) => {
			setErrorMessage("");
			setPendingDeleteId(taskId);

			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks"] });
			await queryClient.cancelQueries({ queryKey: ["tasks", taskId] });

			// Snapshot the previous values
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
			const previousTask = queryClient.getQueryData<Task>(["tasks", taskId]);

			// Optimistically remove from both caches
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old.filter((t) => t.id !== taskId);
			});
			queryClient.removeQueries({ queryKey: ["tasks", taskId] });

			return { previousTasks, previousTask };
		},
		onSuccess: (taskId) => {
			// The task is already removed from cache in onMutate
			setPendingDeleteId(null);
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
			setPendingDeleteId(null);
		},
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			{errorMessage && (
				<Alert color="red" title="Error">
					{errorMessage}
				</Alert>
			)}
			<Group justify="space-between">
				<Text size="xl" fw={700}>
					Tasks
				</Text>
				<Button component={Link} to="/tasks/new" size="lg">
					New Task
				</Button>
			</Group>

			<Stack gap="md">
				{tasks.map((task: Task) => (
					<Card key={task.id} withBorder>
						<Group>
							<Checkbox
								checked={task.status === TaskStatus.COMPLETED}
								onChange={() =>
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
								disabled={task.id.startsWith("-")}
							/>
							<div className="flex flex-col gap-1 flex-1">
								<Link
									to="/tasks/$taskId"
									params={{ taskId: task.id }}
									className={`${
										task.status === TaskStatus.COMPLETED
											? "text-gray-400 line-through"
											: ""
									} ${task.id.startsWith("-") ? "pointer-events-none opacity-50" : ""}`}
								>
									<Text size="lg" fw={500}>
										{task.title}
									</Text>
								</Link>
								{task.description && (
									<Text size="sm" c="dimmed">
										{task.description}
									</Text>
								)}
								{task.due_date && (
									<Text size="xs" c="dimmed">
										Due: {new Date(task.due_date).toLocaleDateString()}
									</Text>
								)}
							</div>
							<Button
								variant="subtle"
								color="red"
								onClick={() => deleteTaskMutation.mutate({ taskId: task.id })}
								disabled={
									task.id.startsWith("-") || pendingDeleteId === task.id
								}
							>
								<Trash2 size={20} />
							</Button>
						</Group>
					</Card>
				))}

				{tasks.length === 0 && (
					<Card withBorder>
						<Text ta="center" c="dimmed">
							No tasks yet. Create one to get started!
						</Text>
					</Card>
				)}
			</Stack>
		</div>
	);
}
