import { Badge, Text } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EntityList } from "~/components/admin/EntityList";
import type { Task } from "~/server/db/schema";
import type { TableDefinition } from "~/types/table";
import { formatDate } from "~/utils/date";
import { queries } from "~/utils/query/queries";

const columns: TableDefinition<Task> = [
	{
		key: "title",
		header: "Title",
		render: ({ value, row }) => (
			<div>
				<Text size="sm" fw={500}>
					{String(value)}
				</Text>
				{row.description && (
					<Text size="xs" c="dimmed" lineClamp={2}>
						{row.description}
					</Text>
				)}
			</div>
		),
	},
	{
		key: "status",
		header: "Status",
		render: ({ value }) => (
			<Badge color={value === "ACTIVE" ? "blue" : "green"}>
				{String(value)}
			</Badge>
		),
	},
	{
		key: "dueDate",
		header: "Due Date",
		render: ({ value }: { value: string | number | Date | null }) => {
			const formatted = formatDate(value);
			return formatted ? (
				<Text size="sm" c="dimmed">
					{formatted}
				</Text>
			) : null;
		},
	},
	{
		key: "createdAt",
		header: "Created",
		render: ({ value }: { value: string | number | Date | null }) => {
			const formatted = formatDate(value);
			return formatted ? (
				<Text size="sm" c="dimmed">
					{formatted}
				</Text>
			) : null;
		},
	},
	{
		key: "updatedAt",
		header: "Last Updated",
		render: ({ value }: { value: string | number | Date | null }) => {
			const formatted = formatDate(value);
			return (
				<Text size="sm" c="dimmed">
					{formatted || "Never"}
				</Text>
			);
		},
	},
];

export const Route = createFileRoute("/admin/tasks/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(queries.task.list()),
	component: TasksComponent,
});

function TasksComponent() {
	const { data: tasks = [] } = useSuspenseQuery(queries.task.list());
	const navigate = useNavigate();

	return (
		<EntityList
			title="Tasks"
			data={tasks}
			columns={columns}
			to="/admin/tasks/:id"
			onAdd={() => navigate({ to: "/admin/tasks/new" })}
		/>
	);
}
