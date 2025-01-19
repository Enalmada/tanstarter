import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminUserForm, type UserFormData } from "~/components/admin/UserForm";
import { Button, Card, Group, Stack } from "~/components/ui";
import type { User } from "~/server/db/schema";
import { useEntityMutations } from "~/utils/query/mutations";
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

	const { updateMutation, deleteMutation } = useEntityMutations<
		User,
		UserFormData
	>({
		entityName: "User",
		entity: user,
		subject: "User",
		listKeys: [adminQueries.adminUser.list.queryKey],
		detailKey: (id) => adminQueries.adminUser.detail(id).queryKey,
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
					onClick={() => deleteMutation.mutate({ entityId: user.id })}
					loading={deleteMutation.isPending}
				>
					Delete User
				</Button>
			</Group>

			<Card withBorder>
				<Stack gap="md" p="md">
					<AdminUserForm
						defaultValues={user}
						onSubmit={(values) =>
							updateMutation.mutate({
								data: values,
							})
						}
						isSubmitting={updateMutation.isPending}
					/>
				</Stack>
			</Card>
		</div>
	);
}
