import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminUserForm, type UserFormData } from "~/components/admin/UserForm";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { User } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
import { preloadQueries, queries, useSuspenseQueries } from "~/utils/query/queries";

function getRouteQueries(userId: string) {
	return [queries.user.byId(userId)] as const;
}

export const Route = createFileRoute("/admin/users/$userId")({
	component: AdminEditUser,
	loader: async ({ context, params }) => {
		await preloadQueries(context.queryClient, getRouteQueries(params.userId));
	},
});

function AdminEditUser() {
	const { userId } = Route.useParams();
	const navigate = useNavigate();

	const [user] = useSuspenseQueries(getRouteQueries(userId));

	const { updateMutation, deleteMutation } = useEntityMutations<User, UserFormData>({
		entityName: "User",
		entity: user,
		subject: "User",
		listKeys: [queries.user.list().queryKey],
		detailKey: (id) => queries.user.byId(id).queryKey,
		navigateTo: "/admin/users",
		navigateBack: `/admin/users/${user.id}`,
		createOptimisticEntity: (data: UserFormData) => ({
			...user,
			...data,
			version: user.version + 1,
			updatedAt: new Date(),
		}),
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<Button variant="ghost" onClick={() => navigate({ to: "/admin/users" })}>
					← Back to Users
				</Button>
				<Button
					variant="ghost"
					className="text-destructive hover:bg-destructive/10 hover:text-destructive"
					onClick={() => deleteMutation.mutate({ entityId: user.id })}
					disabled={deleteMutation.isPending}
				>
					Delete User
				</Button>
			</div>

			<Card className="border">
				<CardContent className="flex flex-col gap-4 p-6">
					<AdminUserForm
						defaultValues={user}
						onSubmit={(values) =>
							updateMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateMutation.isPending}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
