/**
 * Route component for task creation
 * Handles task creation mutation and redirects to task list on success
 * Protected route requiring authentication
 */

import { Card, CardBody } from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TaskForm } from "~/components/TaskForm";
import type { Task } from "~/server/db/schema";
import { createTask } from "~/server/services/task-service";

export const Route = createFileRoute("/tasks/new")({
	component: NewTask,
	loader: async ({ context }) => {
		if (!context.user) {
			throw new Error("Not authenticated");
		}
		return { userId: context.user.id };
	},
});

function NewTask() {
	const { userId } = Route.useLoaderData();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const createTaskMutation = useMutation({
		mutationFn: async (
			data: Omit<Task, "id" | "created_at" | "updated_at" | "user_id">,
		) => {
			const result = await createTask({ data });
			return result;
		},
		onMutate: async (newTask) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks"] });

			// Snapshot current state
			const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

			// Create optimistic task
			const optimisticId = `-${Date.now()}`;
			const optimisticTask: Task = {
				...newTask,
				id: optimisticId,
				user_id: userId,
				created_at: new Date(),
				updated_at: new Date(),
			};

			// Add to cache optimistically
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return [...old, optimisticTask];
			});

			return { previousTasks, optimisticId };
		},
		onError: (err, variables, context) => {
			// Revert cache on error
			if (context?.previousTasks) {
				queryClient.setQueryData(["tasks"], context.previousTasks);
			}
			setErrorMessage(err.message);
		},
		onSuccess: (newTask, _, context) => {
			// Update cache with real task, removing optimistic one
			queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
				return old
					.filter((t) => t.id !== context?.optimisticId)
					.concat(newTask);
			});
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
					<h1 className="text-2xl font-bold">New Task</h1>

					<TaskForm
						onSubmit={(values) =>
							createTaskMutation.mutate({
								title: values.title,
								description: values.description,
								due_date: values.due_date,
								status: values.status,
							})
						}
						isSubmitting={createTaskMutation.isPending}
					/>
				</CardBody>
			</Card>
		</div>
	);
}
