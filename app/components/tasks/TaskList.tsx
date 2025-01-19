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
import { updateEntity } from "~/server/services/base-service";
import { useDeleteEntityMutation } from "~/utils/query/mutations";
import { queries } from "~/utils/query/queries";

export function TaskList({
	userId,
	tasks,
}: { userId: string | undefined; tasks: Task[] }) {
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState("");
	const [pendingTaskIds] = useState(() => new Set<string>());
	const [pendingDeleteIds] = useState(() => new Set<string>());
	const [optimisticVersions] = useState(() => new Map<string, number>());

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
			const updatedData = {
				...data,
				description:
					data.description === undefined
						? currentTask.description
						: data.description,
				// Always send the original version for server validation
				version: currentTask.version,
			};
			const result = await updateEntity({
				data: {
					id: taskId,
					subject: "Task",
					data: updatedData,
				},
			});
			return result as Task;
		},
		onMutate: async ({ taskId, data, currentTask }) => {
			setErrorMessage("");
			pendingTaskIds.add(taskId);

			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: [
					queries.task.list(userId).queryKey,
					queries.task.detail(taskId).queryKey,
				],
			});

			// Snapshot the previous values
			const previousTasks = queryClient.getQueryData<Task[]>(
				queries.task.list(userId).queryKey,
			);
			const previousTask = queryClient.getQueryData<Task>(
				queries.task.detail(taskId).queryKey,
			);

			// Get the current optimistic version or use the task's version
			const currentVersion =
				optimisticVersions.get(taskId) ?? currentTask.version;
			const nextVersion = currentVersion + 1;
			// Store the next version we expect
			optimisticVersions.set(taskId, nextVersion);

			// Create optimistic task with explicit description handling
			const optimisticTask: Task = {
				...currentTask,
				...data,
				version: nextVersion,
				updatedAt: new Date(),
			};

			// Optimistically update both caches
			queryClient.setQueryData<Task[]>(
				queries.task.list(userId).queryKey,
				(old = []) => old.map((t) => (t.id === taskId ? optimisticTask : t)),
			);
			queryClient.setQueryData(
				queries.task.detail(taskId).queryKey,
				optimisticTask,
			);

			return { previousTasks, previousTask };
		},
		onSettled: (updatedTask, error, { taskId }, context) => {
			if (updatedTask && context) {
				// Update both caches with the actual server data
				queryClient.setQueryData<Task[]>(
					queries.task.list(userId).queryKey,
					(old = []) => old.map((t) => (t.id === taskId ? updatedTask : t)),
				);
				queryClient.setQueryData(
					queries.task.detail(taskId).queryKey,
					updatedTask,
				);
				// Update our tracked version with the server version
				optimisticVersions.set(taskId, updatedTask.version);
			}
			if (taskId) {
				pendingTaskIds.delete(taskId);
				if (error) {
					// If there was an error, clear the optimistic version
					optimisticVersions.delete(taskId);
				}
			}
		},
		onSuccess: () => {
			setErrorMessage("");
		},
		onError: (err, { taskId }, context) => {
			// Revert both caches on error
			if (context?.previousTask) {
				queryClient.setQueryData(
					queries.task.detail(taskId).queryKey,
					context.previousTask,
				);
			}
			if (context?.previousTasks) {
				queryClient.setQueryData(
					queries.task.list(userId).queryKey,
					context.previousTasks,
				);
			}

			setErrorMessage(err.message);
		},
	});

	const deleteTaskMutation = useDeleteEntityMutation<Task>({
		entityName: "Task",
		subject: "Task",
		listKeys: [queries.task.list(userId).queryKey],
		detailKey: (entityId) => queries.task.detail(entityId).queryKey,
		pendingDeleteIds,
		setErrorMessage,
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			{errorMessage && (
				<Alert color="red" title="Error">
					{errorMessage}
				</Alert>
			)}
			<Group justify="space-between" className="h-[48px] min-h-[48px]">
				<Text size="xl" fw={700} className="flex-shrink-0">
					Tasks
				</Text>
				<Button
					component={Link}
					to="/tasks/new"
					size="lg"
					className="flex-shrink-0"
				>
					New Task
				</Button>
			</Group>

			<Stack gap="md" className="min-h-[50px]">
				{tasks.map((task: Task) => (
					<Card key={task.id} withBorder className="w-full min-h-[60px]">
						<Group className="w-full justify-between">
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
												dueDate: task.dueDate,
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
									{task.dueDate && (
										<Text size="xs" c="dimmed">
											Due: {new Date(task.dueDate).toLocaleDateString()}
										</Text>
									)}
								</div>
							</Group>
							<Button
								variant="subtle"
								color="red"
								onClick={() => deleteTaskMutation.mutate({ entityId: task.id })}
								disabled={
									task.id.startsWith("-") || pendingDeleteIds.has(task.id)
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
