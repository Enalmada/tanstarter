/**
 * Route component for task creation
 * Handles task creation mutation and redirects to task list on success
 * Protected route requiring authentication
 */

import { createFileRoute } from "@tanstack/react-router";
import { TaskForm } from "~/components/TaskForm";
import { Card, Stack } from "~/components/ui";
import type { Task, TaskStatusType } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
import { queries } from "~/utils/query/queries";

type TaskFormData = {
	title: string;
	description: string | null;
	dueDate: Date | null;
	status: TaskStatusType;
	userId: string;
};

export const Route = createFileRoute("/tasks/new")({
	component: NewTask,
	loader: async ({ context }) => {
		return { userId: context.user?.id };
	},
});

function NewTask() {
	const { userId } = Route.useLoaderData();

	const { createMutation } = useEntityMutations<Task, TaskFormData>({
		entityName: "Task",
		subject: "Task",
		listKeys: [queries.task.list({ userId }).queryKey],
		detailKey: (id) => queries.task.byId(id).queryKey,
		navigateTo: "/tasks",
		navigateBack: "/tasks/new",
		createOptimisticEntity: (data) => ({
			...data,
			id: `temp-${Date.now()}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			version: 1,
			createdById: userId ?? "temp-user",
			updatedById: userId ?? "temp-user",
		}),
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Card withBorder>
				<Stack gap="md" p="md">
					<TaskForm
						onSubmit={createMutation.mutate}
						isSubmitting={createMutation.isPending}
						userId={userId ?? ""}
					/>
				</Stack>
			</Card>
		</div>
	);
}
