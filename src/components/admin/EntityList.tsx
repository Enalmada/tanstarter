import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Container } from "~/components/ui/container";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Title } from "~/components/ui/title";
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
		<Container className="flex flex-col gap-4 py-6">
			<div className="flex items-center justify-between">
				<Title>{title}</Title>
				{onAdd && <Button onClick={onAdd}>Add New</Button>}
			</div>
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map((column) => (
								<TableHead key={column.key as string}>{column.header}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((row) => (
							<TableRow
								key={row.id as string}
								onClick={() => !to && onRowClick?.(row)}
								className={to || onRowClick ? "cursor-pointer" : ""}
							>
								{columns.map((column) => (
									<TableCell key={column.key as string}>
										{to ? (
											<Link to={to.replace(":id", row.id)} className="block w-full">
												{column.render
													? column.render({
															value: row[column.key],
															row,
														})
													: (row[column.key] as string)}
											</Link>
										) : column.render ? (
											column.render({
												value: row[column.key],
												row,
											})
										) : (
											(row[column.key] as string)
										)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</Container>
	);
}
