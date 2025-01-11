import { Container, Table, Title } from "@mantine/core";
import type { ColumnDef, TableOptions } from "@tanstack/react-table";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { TableDefinition } from "~/types/table";

export interface EntityListProps<TData> {
	title: string;
	data: TData[];
	columns: TableDefinition<TData>;
	tableOptions?: Partial<TableOptions<TData>>;
}

function convertToTanStackColumns<TData>(
	columns: TableDefinition<TData>,
): ColumnDef<TData, any>[] {
	const columnHelper = createColumnHelper<TData>();

	return columns.map((col) => {
		return columnHelper.accessor((row: TData) => row[col.key], {
			id: String(col.key),
			header: col.header,
			cell: (info) =>
				col.render
					? col.render({ value: info.getValue(), row: info.row.original })
					: info.getValue(),
		});
	});
}

export function EntityList<TData>({
	title,
	data,
	columns,
	tableOptions = {},
}: EntityListProps<TData>) {
	const tanstackColumns = convertToTanStackColumns(columns);

	const table = useReactTable({
		data,
		columns: tanstackColumns,
		getCoreRowModel: getCoreRowModel(),
		...tableOptions,
	});

	return (
		<Container size="xl">
			<Title mb="lg">{title}</Title>

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
