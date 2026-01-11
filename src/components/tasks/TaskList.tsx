import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import type { Task } from "~/server/db/schema";
import { TaskStatus } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
import { queries } from "~/utils/query/queries";

export function TaskList({ userId, tasks }: { userId: string | undefined; tasks: Task[] }) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const { updateMutation, deleteMutation } = useEntityMutations<Task>({
		entityName: "Task",
		subject: "Task",
		listKeys: [queries.task.list({ userId }).queryKey],
		detailKey: (id) => queries.task.byId(id).queryKey,
		setErrorMessage,
	});

	const handleTaskUpdate = (task: Task, status: keyof typeof TaskStatus) => {
		updateMutation.mutate({
			entity: task,
			data: {
				status,
				version: task.version,
			},
		});
	};

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			{errorMessage && (
				<Alert variant="destructive">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}
			<div className="flex h-12 items-center justify-between">
				<h1 className="text-2xl font-bold">Tasks</h1>
				<Button size="lg" render={<Link to="/tasks/new" />}>
					New Task
				</Button>
			</div>

			<div className="flex min-h-[50px] flex-col gap-4">
				{tasks.map((task: Task) => (
					<Card key={task.id}>
						<CardContent className="flex items-center justify-between gap-4 p-4">
							<div className="flex flex-1 items-center gap-4 overflow-hidden">
								<div className="flex items-center">
									<Checkbox
										checked={task.status === TaskStatus.COMPLETED}
										onCheckedChange={() =>
											handleTaskUpdate(
												task,
												task.status === TaskStatus.ACTIVE ? TaskStatus.COMPLETED : TaskStatus.ACTIVE,
											)
										}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<Link
										to="/tasks/$taskId"
										params={{ taskId: task.id }}
										className={`block overflow-hidden text-ellipsis whitespace-nowrap ${
											task.status === TaskStatus.COMPLETED ? "text-muted-foreground line-through" : ""
										}`}
									>
										<span className="text-lg font-medium">{task.title}</span>
									</Link>
									{task.description && (
										<p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-foreground">
											{task.description}
										</p>
									)}
									{task.dueDate && (
										<p className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
									)}
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => deleteMutation.mutate({ entityId: task.id })}
								className="shrink-0"
							>
								<Trash2 className="h-5 w-5" />
							</Button>
						</CardContent>
					</Card>
				))}

				{tasks.length === 0 && (
					<Card>
						<CardContent className="p-4 text-center text-muted-foreground">
							No tasks yet. Create one to get started!
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
