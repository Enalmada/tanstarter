import { Avatar, Container, Group, Table, Text, Title } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import type { User } from "~/server/db/schema";
import { adminQueries } from "~/utils/queries";

const columnHelper = createColumnHelper<User>();

const columns = [
	columnHelper.accessor("name", {
		header: "User",
		cell: (info) => (
			<Group gap="sm">
				<Avatar size="sm" src={info.row.original.avatar_url} radius="xl" />
				<div>
					<Text size="sm" fw={500}>
						{info.getValue()}
					</Text>
					<Text size="xs" c="dimmed">
						{info.row.original.email}
					</Text>
				</div>
			</Group>
		),
	}),
	columnHelper.accessor("created_at", {
		header: "Joined",
		cell: (info) => (
			<Text size="sm" c="dimmed">
				{formatDistanceToNow(info.getValue(), { addSuffix: true })}
			</Text>
		),
	}),
	columnHelper.accessor("updated_at", {
		header: "Last Updated",
		cell: (info) => {
			const date = info.getValue();
			return (
				<Text size="sm" c="dimmed">
					{date ? formatDistanceToNow(date, { addSuffix: true }) : "Never"}
				</Text>
			);
		},
	}),
];

export const Route = createFileRoute("/admin/users/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(adminQueries.adminUser.list),
	component: UsersComponent,
});

function UsersComponent() {
	const { data: users = [] } = useSuspenseQuery(adminQueries.adminUser.list);

	const table = useReactTable({
		data: users,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<Container size="xl">
			<Title mb="lg">Users</Title>

			<Table highlightOnHover withTableBorder>
				<Table.Thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<Table.Tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<Table.Th key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</Table.Th>
							))}
						</Table.Tr>
					))}
				</Table.Thead>
				<Table.Tbody>
					{table.getRowModel().rows.map((row) => (
						<Table.Tr key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<Table.Td key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</Table.Td>
							))}
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</Container>
	);
}
