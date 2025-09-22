/**
 * Task edit route component
 * Handles task updates and manages task data fetching
 * Includes navigation back to task list and form state management
 */

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskForm, type TaskFormData } from "~/components/TaskForm";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { Task } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
import { queries } from "~/utils/query/queries";

export const Route = createFileRoute("/tasks/$taskId")({
	component: EditTask,
	loader: async ({ context, params }) => {
		const userId = context.user?.id;
		// @ts-expect-error - React Query type conflicts from version mismatches
		await context.queryClient.ensureQueryData(queries.task.byId(params.taskId));
		return { userId };
	},
});

function EditTask() {
	const { taskId } = Route.useParams();
	// @ts-expect-error - React Query type conflicts from version mismatches
	const { data: task } = useSuspenseQuery(queries.task.byId(taskId));
	const navigate = useNavigate();
	const { userId } = Route.useLoaderData();

	const { updateMutation, deleteMutation } = useEntityMutations<
		Task,
		TaskFormData
	>({
		entityName: "Task",
		entity: task,
		subject: "Task",
		listKeys: [queries.task.list({ userId }).queryKey],
		detailKey: (id) => queries.task.byId(id).queryKey,
		navigateTo: "/tasks",
		navigateBack: `/tasks/${task.id}`,
		createOptimisticEntity: (data: TaskFormData) => ({
			...task,
			...data,
			version: task.version + 1,
			updatedAt: new Date(),
		}),
	});

	return (
		<div className="container mx-auto space-y-4 p-6">
			<div className="flex justify-between items-center">
				<Button variant="ghost" onClick={() => navigate({ to: "/tasks" })}>
					← Back to Tasks
				</Button>
				<Button
					variant="destructive"
					onClick={() => deleteMutation.mutate({ entityId: task.id })}
					disabled={deleteMutation.isPending}
				>
					Delete Task
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6 space-y-4">
					<TaskForm
						defaultValues={{
							...task,
							userId: userId ?? "",
						}}
						onSubmit={(values) =>
							updateMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateMutation.isPending}
						userId={userId ?? ""}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
