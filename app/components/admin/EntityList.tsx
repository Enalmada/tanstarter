import { Table } from "@mantine/core";
import type { TableDefinition } from "~/types/table";

export interface EntityListProps<TData extends { id: string }> {
	title: string;
	data: TData[];
	columns: TableDefinition<TData>;
	onRowClick?: (row: TData) => void;
}

export function EntityList<TData extends { id: string }>({
	title,
	data,
	columns,
	onRowClick,
}: EntityListProps<TData>) {
	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">{title}</h1>
			<Table>
				<Table.Thead>
					<Table.Tr>
						{columns.map((column) => (
							<Table.Th key={column.key as string}>{column.header}</Table.Th>
						))}
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{data.map((row) => (
						<Table.Tr
							key={row.id as string}
							onClick={() => onRowClick?.(row)}
							className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
						>
							{columns.map((column) => (
								<Table.Td key={column.key as string}>
									{column.render
										? column.render({
												value: row[column.key],
												row,
											})
										: (row[column.key] as string)}
								</Table.Td>
							))}
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</div>
	);
}
