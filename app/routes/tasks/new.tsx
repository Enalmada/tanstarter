/**
 * Route component for task creation
 * Handles task creation mutation and redirects to task list on success
 * Protected route requiring authentication
 */

import { Card, CardBody } from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { type Task, TaskStatus } from "~/server/db/schema";
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
	const router = useRouter();

	const createTaskMutation = useMutation<
		Task,
		Error,
		Omit<Task, "id" | "created_at" | "updated_at" | "user_id">
	>({
		mutationFn: async (data) => {
			const result = await createTask({ data });
			return result;
		},
		onSuccess: async (newTask) => {
			// Invalidate both React Query and Router caches
			queryClient.invalidateQueries({ queryKey: ["tasks"] });
			queryClient.setQueryData(["task", newTask.id], newTask);
			await router.invalidate();
			navigate({ to: "/tasks" });
		},
	});

	return (
		<div className="container mx-auto p-6">
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
