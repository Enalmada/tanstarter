import { Badge, Text } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EntityList } from "~/components/admin/EntityList";
import type { User } from "~/server/db/schema";
import type { TableDefinition } from "~/types/table";
import { formatDate } from "~/utils/date";
import { adminQueries } from "~/utils/query/queries";

const columns: TableDefinition<User> = [
	{
		key: "id",
		header: "ID",
	},
	{
		key: "name",
		header: "Name",
	},
	{
		key: "email",
		header: "Email",
		render: ({ value, row }) => (
			<div>
				<Text size="sm" fw={500}>
					{String(value)}
				</Text>
				{row.name && (
					<Text size="xs" c="dimmed">
						{row.name}
					</Text>
				)}
			</div>
		),
	},
	{
		key: "role",
		header: "Role",
		render: ({ value }) => (
			<Badge color={value === "ADMIN" ? "red" : "blue"}>{String(value)}</Badge>
		),
	},
	{
		key: "createdAt",
		header: "Created",
		render: ({ value }: { value: string | number | Date | boolean | null }) => {
			if (typeof value === "boolean") return null;
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
		render: ({ value }: { value: string | number | Date | boolean | null }) => {
			if (typeof value === "boolean") return null;
			const formatted = formatDate(value);
			return (
				<Text size="sm" c="dimmed">
					{formatted}
				</Text>
			);
		},
	},
];

export const Route = createFileRoute("/admin/users/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(adminQueries.adminUser.list),
	component: UsersComponent,
});

function UsersComponent() {
	const { data: users = [] } = useSuspenseQuery(adminQueries.adminUser.list);
	const navigate = useNavigate();

	return (
		<EntityList
			title="Users"
			data={users}
			columns={columns}
			onRowClick={(row: User) => navigate({ to: `/admin/users/${row.id}` })}
		/>
	);
}
