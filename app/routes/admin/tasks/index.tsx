import { Badge, Text } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow, isValid } from "date-fns";
import { EntityList } from "~/components/admin/EntityList";
import type { Task } from "~/server/db/schema";
import type { TableDefinition } from "~/types/table";
import { adminQueries } from "~/utils/query/queries";

const formatDate = (value: string | Date | null): string | null => {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	if (!isValid(date)) return null;
	return formatDistanceToNow(date, { addSuffix: true });
};

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
		key: "due_date",
		header: "Due Date",
		render: ({ value }) => {
			const formatted = formatDate(value);
			return formatted ? (
				<Text size="sm" c="dimmed">
					{formatted}
				</Text>
			) : null;
		},
	},
	{
		key: "created_at",
		header: "Created",
		render: ({ value }) => {
			const formatted = formatDate(value);
			return formatted ? (
				<Text size="sm" c="dimmed">
					{formatted}
				</Text>
			) : null;
		},
	},
	{
		key: "updated_at",
		header: "Last Updated",
		render: ({ value }) => {
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
		context.queryClient.ensureQueryData(adminQueries.adminTask.list),
	component: TasksComponent,
});

function TasksComponent() {
	const { data: tasks = [] } = useSuspenseQuery(adminQueries.adminTask.list);
	const navigate = useNavigate();

	return (
		<EntityList
			title="Tasks"
			data={tasks}
			columns={columns}
			onRowClick={(row: Task) => navigate({ to: `/admin/tasks/${row.id}` })}
		/>
	);
}
