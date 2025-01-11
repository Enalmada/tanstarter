import { Avatar, Group, Text } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { EntityList } from "~/components/admin/EntityList";
import type { User } from "~/server/db/schema";
import type { TableDefinition } from "~/types/table";
import { adminQueries } from "~/utils/query/queries";

const columns: TableDefinition<User> = [
	{
		key: "name",
		header: "User",
		render: ({ value, row }) => (
			<Group gap="sm">
				<Avatar size="sm" src={row.avatar_url} radius="xl" />
				<div>
					<Text size="sm" fw={500}>
						{value}
					</Text>
					<Text size="xs" c="dimmed">
						{row.email}
					</Text>
				</div>
			</Group>
		),
	},
	{
		key: "created_at",
		header: "Joined",
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

export const Route = createFileRoute("/admin/users/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(adminQueries.adminUser.list),
	component: UsersComponent,
});

function UsersComponent() {
	const { data: users = [] } = useSuspenseQuery(adminQueries.adminUser.list);
	return <EntityList title="Users" data={users} columns={columns} />;
}
