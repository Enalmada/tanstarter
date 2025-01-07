/**
 * Main task list route component
 * Displays all tasks with completion toggle functionality
 * Includes task creation link and handles task status updates
 */

import {
	Button,
	Card,
	CardBody,
	Checkbox,
	useDisclosure,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type Task, TaskStatus } from "~/server/db/schema";
import { fetchTasks, updateTask } from "~/server/services/task-service";

export const Route = createFileRoute("/tasks/")({
	component: TaskList,
	loader: async ({ context }) => {
		if (!context.user) {
			throw new Error("Not authenticated");
		}
		return { userId: context.user.id };
	},
});

function TaskList() {
	const { userId } = Route.useLoaderData();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState("");

	const { data: tasks = [], isLoading } = useQuery({
		queryKey: ["tasks", userId],
		queryFn: async () => {
			const result = await fetchTasks({});
			return result;
		},
	});

	const updateTaskMutation = useMutation<
		Task,
		Error,
		{ taskId: string; data: Partial<Task>; currentTask: Task },
		{ previousTasks: Task[] | undefined }
	>({
		mutationFn: async ({ taskId, data, currentTask }) => {
			const result = await updateTask({
				data: {
					taskId,
					data: {
						title: currentTask.title,
						description: currentTask.description,
						due_date: currentTask.due_date,
						status: data.status,
					},
				},
			});
			return result;
		},
		onMutate: async ({ taskId, data, currentTask }) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks", userId]);

			// Optimistically update tasks
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.map((task) =>
					task.id === taskId ? { ...task, ...data } : task,
				);
			});

			// Return context with the snapshotted value
			return { previousTasks };
		},
		onError: (err, variables, context) => {
			// If the mutation fails, use the context we returned above
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks", userId], context.previousTasks);
			}
			setErrorMessage(err.message);
		},
		onSuccess: (updatedTask, { taskId }) => {
			// Update the tasks list with the returned data
			queryClient.setQueryData<Task[]>(["tasks", userId], (old = []) => {
				return old.map((task) => (task.id === taskId ? updatedTask : task));
			});
		},
	});

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			{errorMessage && (
				<div className="rounded-medium bg-danger-50 p-3 text-danger text-sm">
					{errorMessage}
				</div>
			)}
			<div className="flex items-center justify-between">
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
							/>
							<div className="flex flex-col gap-1">
								<Link
									to="/tasks/$taskId"
									params={{ taskId: task.id }}
									className={
										task.status === TaskStatus.COMPLETED
											? "text-default-400 line-through"
											: ""
									}
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
