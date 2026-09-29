import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminTaskForm, type TaskFormData } from "~/components/admin/TaskForm";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { Task } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
import { queries } from "~/utils/query/queries";

export const Route = createFileRoute("/_authed/_admin/admin/tasks/new")({
	component: AdminNewTask,
	loader: async ({ context }) => {
		return { userId: context.user.id };
	},
});

function AdminNewTask() {
	const navigate = useNavigate();
	const { userId } = Route.useLoaderData();

	const { createMutation } = useEntityMutations<Task, TaskFormData>({
		entityName: "Task",
		subject: "Task",
		listKeys: [queries.task.list().queryKey],
		navigateTo: "/admin/tasks",
		navigateBack: "/admin/tasks/new",
		detailKey: (id) => queries.task.byId(id).queryKey,
		createOptimisticEntity: (data: TaskFormData) => ({
			...data,
			id: `temp-${Date.now()}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			version: 1,
			createdById: userId ?? "",
			updatedById: userId ?? "",
		}),
	});

	return (
		<div className="container mx-auto space-y-4 p-6">
			<div className="flex justify-between items-center">
				<Button variant="ghost" onClick={() => navigate({ to: "/admin/tasks" })}>
					← Back to Tasks
				</Button>
			</div>

			<Card>
				<CardContent className="space-y-4">
					<AdminTaskForm onSubmit={createMutation.mutate} isSubmitting={createMutation.isPending} />
				</CardContent>
			</Card>
		</div>
	);
}
