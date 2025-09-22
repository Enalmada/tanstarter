import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EntityList } from "~/components/admin/EntityList";
import { Badge } from "~/components/ui/badge";
import type { User } from "~/server/db/schema";
import type { TableDefinition } from "~/types/table";
import { formatDate } from "~/utils/date";
import { preloadQueries, queries, useSuspenseQueries } from "~/utils/query/queries";

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
				<p className="text-sm font-medium">{String(value)}</p>
				{row.name && <p className="text-xs text-muted-foreground">{row.name}</p>}
			</div>
		),
	},
	{
		key: "role",
		header: "Role",
		render: ({ value }) => <Badge variant={value === "ADMIN" ? "destructive" : "default"}>{String(value)}</Badge>,
	},
	{
		key: "createdAt",
		header: "Created",
		render: ({ value }: { value: string | number | Date | boolean | null }) => {
			if (typeof value === "boolean") return null;
			const formatted = formatDate(value);
			return formatted ? <p className="text-sm text-muted-foreground">{formatted}</p> : null;
		},
	},
	{
		key: "updatedAt",
		header: "Last Updated",
		render: ({ value }: { value: string | number | Date | boolean | null }) => {
			if (typeof value === "boolean") return null;
			const formatted = formatDate(value);
			return formatted ? <p className="text-sm text-muted-foreground">{formatted}</p> : null;
		},
	},
];

function getRouteQueries() {
	return [queries.user.list()] as const;
}

export const Route = createFileRoute("/admin/users/")({
	component: UsersPage,
	loader: async ({ context: { queryClient } }) => {
		await preloadQueries(queryClient, getRouteQueries());
	},
});

function UsersPage() {
	const navigate = useNavigate();
	const [users] = useSuspenseQueries(getRouteQueries());

	return (
		<EntityList
			title="Users"
			data={users}
			columns={columns}
			onRowClick={(item) => navigate({ to: `/admin/users/${item.id}` })}
		/>
	);
}
