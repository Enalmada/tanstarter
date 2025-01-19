import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { showToast } from "~/components/Toast";
import { AdminUserForm, type UserFormData } from "~/components/admin/UserForm";
import { Button, Card, Group, Stack } from "~/components/ui";
import type { User } from "~/server/db/schema";
import { updateEntity } from "~/server/services/base-service";
import { useDeleteEntityMutation } from "~/utils/query/mutations";
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
	const queryClient = useQueryClient();

	const updateUserMutation = useMutation({
		mutationFn: async (data: UserFormData) => {
			const result = await updateEntity({
				data: {
					id: user.id,
					subject: "User",
					data: {
						...data,
						version: user.version,
					},
				},
			});
			return result;
		},
		onMutate: async (newData) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: [
					adminQueries.adminUser.list.queryKey,
					adminQueries.adminUser.detail(user.id).queryKey,
				],
			});

			// Snapshot the previous values
			const previousUsers = queryClient.getQueryData<User[]>(
				adminQueries.adminUser.list.queryKey,
			);
			const previousUser = queryClient.getQueryData<User>(
				adminQueries.adminUser.detail(user.id).queryKey,
			);

			// Use a consistent timestamp for optimistic updates
			const now = new Date().toISOString();

			// Create optimistic user
			const optimisticUser: User = {
				...user,
				emailVerified: false,
				image: null,
				email: newData.email,
				name: newData.name,
				role: newData.role,
				version: user.version + 1,
				updatedAt: new Date(now),
			};

			// Optimistically update both caches
			queryClient.setQueryData<User[]>(
				adminQueries.adminUser.list.queryKey,
				(old = []) =>
					old.map((u) => (u.id === user.id ? (optimisticUser as User) : u)),
			);
			queryClient.setQueryData(
				adminQueries.adminUser.detail(user.id).queryKey,
				optimisticUser,
			);

			// Navigate optimistically
			navigate({ to: "/admin/users" });

			// Return a context object with the snapshotted values
			return { previousUsers, previousUser };
		},
		onSettled: (updatedUser, error, _variables, context) => {
			if (updatedUser && context) {
				// Update both caches with the actual server data
				queryClient.setQueryData<User[]>(
					adminQueries.adminUser.list.queryKey,
					(old = []) =>
						old.map((u) => (u.id === user.id ? (updatedUser as User) : u)),
				);
				queryClient.setQueryData(
					adminQueries.adminUser.detail(user.id).queryKey,
					updatedUser,
				);
			}
		},
		onSuccess: (_updatedUser) => {
			showToast({
				title: "Success",
				description: "User updated successfully",
				type: "success",
			});
		},
		onError: (error, _variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousUser) {
				queryClient.setQueryData(
					adminQueries.adminUser.detail(user.id).queryKey,
					context.previousUser,
				);
			}
			if (context?.previousUsers) {
				queryClient.setQueryData(
					adminQueries.adminUser.list.queryKey,
					context.previousUsers,
				);
			}
			showToast({
				title: "Error",
				description: error.message,
				type: "error",
			});
			// Navigate back to the form on error
			navigate({ to: `/admin/users/${user.id}` });
		},
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
						onSubmit={(values) => updateUserMutation.mutate(values)}
						isSubmitting={updateUserMutation.isPending}
					/>
				</Stack>
			</Card>
		</div>
	);
}
