import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { EntityList } from "~/components/admin/EntityList";
import { Badge } from "~/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import type { Task } from "~/server/db/schema";
import type { TableDefinition } from "~/types/table";
import { formatDate } from "~/utils/date";
import { preloadQueries, queries, useSuspenseQueries } from "~/utils/query/queries";

const columns: TableDefinition<Task> = [
	{
		key: "title",
		header: "Title",
		render: ({ value, row }) => (
			<div>
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium">{String(value)}</p>
					<Popover>
						<PopoverTrigger className="hover:text-accent-foreground">
							<Info className="h-4 w-4" />
						</PopoverTrigger>
						<PopoverContent className="w-auto p-2">
							<p className="text-xs font-mono">ID: {row.id}</p>
						</PopoverContent>
					</Popover>
				</div>
				{row.description && <p className="text-xs text-muted-foreground line-clamp-2">{row.description}</p>}
			</div>
		),
	},
	{
		key: "status",
		header: "Status",
		render: ({ value }) => <Badge variant={value === "ACTIVE" ? "default" : "secondary"}>{String(value)}</Badge>,
	},
	{
		key: "dueDate",
		header: "Due Date",
		render: ({ value }: { value: string | number | Date | null }) => {
			const formatted = formatDate(value);
			return formatted ? <p className="text-sm text-muted-foreground">{formatted}</p> : null;
		},
	},
	{
		key: "createdAt",
		header: "Created",
		render: ({ value }: { value: string | number | Date | null }) => {
			const formatted = formatDate(value);
			return formatted ? <p className="text-sm text-muted-foreground">{formatted}</p> : null;
		},
	},
	{
		key: "updatedAt",
		header: "Last Updated",
		render: ({ value }: { value: string | number | Date | null }) => {
			const formatted = formatDate(value);
			return <p className="text-sm text-muted-foreground">{formatted || "Never"}</p>;
		},
	},
];

function getRouteQueries() {
	return [queries.task.list()] as const;
}

export const Route = createFileRoute("/admin/tasks/")({
	component: TasksPage,
	loader: async ({ context: { queryClient } }) => {
		await preloadQueries(queryClient, getRouteQueries());
	},
});

function TasksPage() {
	const navigate = useNavigate();
	const [tasks] = useSuspenseQueries(getRouteQueries());

	return (
		<EntityList
			title="Tasks"
			data={tasks}
			columns={columns}
			onRowClick={(item) => navigate({ to: `/admin/tasks/${item.id}` })}
			onAdd={() => navigate({ to: "/admin/tasks/new" })}
		/>
	);
}
