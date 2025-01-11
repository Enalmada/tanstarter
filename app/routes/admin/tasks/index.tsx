import { Badge, Text } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { EntityList } from "~/components/admin/EntityList";
import type { Task } from "~/server/db/schema";
import type { TableDefinition } from "~/types/table";
import { adminQueries } from "~/utils/queries";

const columns: TableDefinition<Task> = [
	{
		key: "title",
		header: "Title",
		render: ({ value, row }) => (
			<div>
				<Text size="sm" fw={500}>
					{value}
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
			<Badge color={value === "ACTIVE" ? "blue" : "green"}>{value}</Badge>
		),
	},
	{
		key: "due_date",
		header: "Due Date",
		render: ({ value }) =>
			value ? (
				<Text size="sm" c="dimmed">
					{formatDistanceToNow(value, { addSuffix: true })}
				</Text>
			) : (
				<Text size="sm" c="dimmed">
					No due date
				</Text>
			),
	},
	{
		key: "created_at",
		header: "Created",
		render: ({ value }) => (
			<Text size="sm" c="dimmed">
				{formatDistanceToNow(value, { addSuffix: true })}
			</Text>
		),
	},
	{
		key: "updated_at",
		header: "Last Updated",
		render: ({ value }) => (
			<Text size="sm" c="dimmed">
				{value ? formatDistanceToNow(value, { addSuffix: true }) : "Never"}
			</Text>
		),
	},
];

export const Route = createFileRoute("/admin/tasks/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(adminQueries.adminTask.list),
	component: TasksComponent,
});

function TasksComponent() {
	const { data: tasks = [] } = useSuspenseQuery(adminQueries.adminTask.list);
	return <EntityList title="Tasks" data={tasks} columns={columns} />;
}
