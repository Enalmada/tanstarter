import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminUserForm, type UserFormData } from "~/components/admin/UserForm";
import { Button, Card, Group, Stack } from "~/components/ui";
import type { User } from "~/server/db/schema";
import {
	useDeleteEntityMutation,
	useUpdateEntityMutation,
} from "~/utils/query/mutations";
import { adminQueries } from "~/utils/query/queries";

export const Route = createFileRoute("/admin/users/$userId")({
	component: AdminEditUser,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			adminQueries.adminUser.detail(params.userId),
		);
	},
});

function AdminEditUser() {
	const { userId } = Route.useParams();
	const { data: user } = useSuspenseQuery(
		adminQueries.adminUser.detail(userId),
	);
	const navigate = useNavigate();

	const updateUserMutation = useUpdateEntityMutation<User, UserFormData>({
		entityName: "User",
		entity: user,
		subject: "User",
		listKeys: [adminQueries.adminUser.list.queryKey],
		detailKey: adminQueries.adminUser.detail(user.id).queryKey,
		navigateTo: "/admin/users",
		navigateBack: `/admin/users/${user.id}`,
		createOptimisticEntity: (entity, data) => ({
			...entity,
			...data,
			version: entity.version + 1,
			updatedAt: new Date(),
		}),
	});

	const deleteUserMutation = useDeleteEntityMutation<User>({
		entityName: "User",
		entityId: user.id,
		subject: "User",
		listKeys: [adminQueries.adminUser.list.queryKey],
		detailKey: (entityId) => adminQueries.adminUser.detail(entityId).queryKey,
		navigateTo: "/admin/users",
		navigateBack: `/admin/users/${user.id}`,
	});

	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Group justify="space-between">
				<Button
					variant="subtle"
					onClick={() => navigate({ to: "/admin/users" })}
				>
					← Back to Users
				</Button>
				<Button
					color="red"
					variant="subtle"
					onClick={() => deleteUserMutation.mutate({})}
					loading={deleteUserMutation.isPending}
				>
					Delete User
				</Button>
			</Group>

			<Card withBorder>
				<Stack gap="md" p="md">
					<AdminUserForm
						defaultValues={user}
						onSubmit={(values) =>
							updateUserMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateUserMutation.isPending}
					/>
				</Stack>
			</Card>
		</div>
	);
}
