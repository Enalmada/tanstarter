import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { DefaultLayout } from "~/components/layouts/DefaultLayout";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { makeUserAdmin } from "~/functions/user-role";
import { UserRole } from "~/server/db/schema";

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
	beforeLoad: async ({ context }) => {
		const user = context.user;

		if (!user) {
			throw redirect({ to: "/signin" });
		}
	},
	loader: ({ context }) => ({
		user: context.user ?? null,
	}),
});

function ProfilePage() {
	const { user: initialUser } = Route.useLoaderData();
	const router = useRouter();
	const [isUpdatingRole, setIsUpdatingRole] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [optimisticUser, setOptimisticUser] = useState(initialUser);

	if (!initialUser) {
		return null; // This shouldn't happen due to beforeLoad, but TypeScript needs it
	}

	// Use optimistic user for UI, fallback to initial user
	const user = optimisticUser || initialUser;

	const handleMakeAdmin = async () => {
		setIsUpdatingRole(true);
		setMessage(null);

		// Optimistic update - immediately update UI
		setOptimisticUser((prevUser) => (prevUser ? { ...prevUser, role: UserRole.ADMIN } : prevUser));

		try {
			await makeUserAdmin({
				data: {
					userId: user.id,
					role: UserRole.ADMIN,
				},
			});

			setMessage("Success! You are now an admin.");

			// Invalidate router data to sync with server
			router.invalidate();
		} catch (_error) {
			// Revert optimistic update on error
			setOptimisticUser(initialUser);
			setMessage("Failed to update role. Please try again.");
		} finally {
			setIsUpdatingRole(false);
		}
	};

	const handleRemoveAdmin = async () => {
		setIsUpdatingRole(true);
		setMessage(null);

		// Optimistic update - immediately update UI
		setOptimisticUser((prevUser) => (prevUser ? { ...prevUser, role: UserRole.MEMBER } : prevUser));

		try {
			await makeUserAdmin({
				data: {
					userId: user.id,
					role: UserRole.MEMBER,
				},
			});

			setMessage("Success! You are now a member.");

			// Invalidate router data to sync with server
			router.invalidate();
		} catch (_error) {
			// Revert optimistic update on error
			setOptimisticUser(initialUser);
			setMessage("Failed to update role. Please try again.");
		} finally {
			setIsUpdatingRole(false);
		}
	};

	// Pre-compute the avatar URL (similar to Navbar logic)
	const getGravatarUrl = (email: string) => {
		const hash = email
			.trim()
			.toLowerCase()
			.split("")
			.map((char) => char.charCodeAt(0).toString(16))
			.join("");
		return `https://www.gravatar.com/avatar/${hash}?d=mp`;
	};

	const avatarUrl = user.image ?? (user.email ? getGravatarUrl(user.email) : undefined);

	return (
		<DefaultLayout user={user}>
			<div className="container max-w-2xl mx-auto p-6">
				<div className="flex justify-between items-center mb-4">
					<Button variant="ghost" onClick={() => router.navigate({ to: "/tasks" })}>
						← Back to Tasks
					</Button>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>User Profile</CardTitle>
						<CardDescription>Manage your account settings and permissions</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* User Info */}
						<div className="flex items-center space-x-4">
							<Avatar className="w-16 h-16">
								<AvatarImage src={avatarUrl} alt={user.name ?? ""} />
								<AvatarFallback className="text-lg">{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
							</Avatar>
							<div className="space-y-1">
								<h3 className="text-lg font-medium">{user.name}</h3>
								<p className="text-muted-foreground">{user.email}</p>
								<div className="flex items-center space-x-2">
									<span className="text-sm">Role:</span>
									<Badge variant={user.role === UserRole.ADMIN ? "default" : "secondary"}>{user.role}</Badge>
								</div>
							</div>
						</div>

						{/* Admin Testing Section */}
						{user.role !== UserRole.ADMIN && (
							<div className="border-t pt-6">
								<h4 className="text-md font-medium mb-3">Development & Testing</h4>
								<p className="text-sm text-muted-foreground mb-4">
									For testing admin functionality, you can temporarily grant admin access to this account.
								</p>
								<Button onClick={handleMakeAdmin} disabled={isUpdatingRole} variant="outline">
									{isUpdatingRole ? "Processing..." : "Make Admin (Dev Only)"}
								</Button>
							</div>
						)}

						{user.role === UserRole.ADMIN && !isUpdatingRole && (
							<div className="border-t pt-6">
								<Alert>
									<AlertDescription>
										🎉 You have admin privileges! You can access the Admin panel from the dropdown menu.
									</AlertDescription>
								</Alert>
								<div className="mt-4">
									<h4 className="text-md font-medium mb-3">Development & Testing</h4>
									<p className="text-sm text-muted-foreground mb-4">
										Remove admin privileges to test member functionality.
									</p>
									<Button onClick={handleRemoveAdmin} disabled={isUpdatingRole} variant="outline">
										{isUpdatingRole ? "Processing..." : "Remove Admin (Dev Only)"}
									</Button>
								</div>
							</div>
						)}

						{user.role === UserRole.ADMIN && isUpdatingRole && (
							<div className="border-t pt-6">
								<div className="mt-4">
									<h4 className="text-md font-medium mb-3">Development & Testing</h4>
									<p className="text-sm text-muted-foreground mb-4">
										Remove admin privileges to test member functionality.
									</p>
									<Button onClick={handleRemoveAdmin} disabled={isUpdatingRole} variant="outline">
										{isUpdatingRole ? "Processing..." : "Remove Admin (Dev Only)"}
									</Button>
								</div>
							</div>
						)}

						{/* Message Display */}
						{message && (
							<div className="border-t pt-6">
								<Alert>
									<AlertDescription className="text-sm">{message}</AlertDescription>
								</Alert>
							</div>
						)}

						{/* Account Details */}
						<div className="border-t pt-6">
							<h4 className="text-md font-medium mb-3">Account Information</h4>
							<div className="grid grid-cols-1 gap-3 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">User ID:</span>
									<span className="font-mono text-xs">{user.id}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Email Verified:</span>
									<span>{user.emailVerified ? "Yes" : "No"}</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</DefaultLayout>
	);
}
