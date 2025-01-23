import { Table } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { TableDefinition } from "~/types/table";

export interface EntityListProps<TData extends { id: string }> {
	title: string;
	data: TData[];
	columns: TableDefinition<TData>;
	onRowClick?: (row: TData) => void;
	onAdd?: () => void;
	to?: string;
}

export function EntityList<TData extends { id: string }>({
	title,
	data,
	columns,
	onRowClick,
	onAdd,
	to,
}: EntityListProps<TData>) {
	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">{title}</h1>
				{onAdd && (
					<button
						type="button"
						onClick={onAdd}
						className="rounded-sm bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Add New
					</button>
				)}
			</div>
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
							className={to || onRowClick ? "hover:bg-gray-50" : ""}
							onClick={() => !to && onRowClick?.(row)}
						>
							{columns.map((column) => (
								<Table.Td key={column.key as string}>
									{to ? (
										<Link
											to={to.replace(":id", row.id)}
											className="block w-full"
										>
											{column.render
												? column.render({
														value: row[column.key],
														row,
													})
												: (row[column.key] as string)}
										</Link>
									) : (
										<>
											{column.render
												? column.render({
														value: row[column.key],
														row,
													})
												: (row[column.key] as string)}
										</>
									)}
								</Table.Td>
							))}
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</div>
	);
}
