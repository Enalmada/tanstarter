import {
	Alert,
	Button,
	Card,
	Checkbox,
	Group,
	Stack,
	Text,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { Task } from "~/server/db/schema";
import { TaskStatus } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
import { queries } from "~/utils/query/queries";

export function TaskList({
	userId,
	tasks,
}: { userId: string | undefined; tasks: Task[] }) {
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
				<Alert color="red" title="Error">
					{errorMessage}
				</Alert>
			)}
			<Group justify="space-between" className="h-[48px] min-h-[48px]">
				<Text size="xl" fw={700} className="shrink-0">
					Tasks
				</Text>
				<Button component={Link} to="/tasks/new" size="lg" className="shrink-0">
					New Task
				</Button>
			</Group>

			<Stack gap="md" className="min-h-[50px]">
				{tasks.map((task: Task) => (
					<Card key={task.id} withBorder className="w-full min-h-[60px]">
						<Group className="w-full justify-between" wrap="nowrap">
							<Group wrap="nowrap" className="flex-1 overflow-hidden">
								<Checkbox
									checked={task.status === TaskStatus.COMPLETED}
									onChange={() =>
										handleTaskUpdate(
											task,
											task.status === TaskStatus.ACTIVE
												? TaskStatus.COMPLETED
												: TaskStatus.ACTIVE,
										)
									}
								/>
								<div className="flex flex-col gap-1 min-w-0">
									<Link
										to="/tasks/$taskId"
										params={{ taskId: task.id }}
										className={`${
											task.status === TaskStatus.COMPLETED
												? "text-gray-400 line-through"
												: ""
										} block overflow-hidden text-ellipsis whitespace-nowrap`}
									>
										<Text size="lg" fw={500}>
											{task.title}
										</Text>
									</Link>
									{task.description && (
										<Text
											size="sm"
											c="dimmed"
											className="overflow-hidden text-ellipsis whitespace-nowrap"
										>
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
								onClick={() => deleteMutation.mutate({ entityId: task.id })}
								className="shrink-0"
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
