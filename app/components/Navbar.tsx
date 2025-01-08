/**
 * Main navigation component
 * Handles user authentication state and navigation links
 * Includes responsive design with mobile menu
 */

import { Avatar, Button, Group, Menu, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ClientUser } from "~/server/db/schema";

interface NavbarProps {
	user: ClientUser | null;
}

export function Navbar({ user }: NavbarProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const handleSignOut = async () => {
		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				// Clear all queries from the cache
				queryClient.clear();
				// Navigate using the router
				navigate({ to: "/" });
			} else {
				throw new Error("Failed to sign out");
			}
		} catch (error) {
			console.error("Sign out error:", error);
		}
	};

	return (
		<Group h="100%" px="md" justify="space-between">
			<Link to="/" className="text-2xl font-bold">
				TanStarter
			</Link>

			<Group>
				{user ? (
					<>
						<Menu shadow="md" width={200}>
							<Menu.Target>
								<Avatar
									src={user.avatar_url}
									alt={user.name ?? ""}
									className="cursor-pointer"
								/>
							</Menu.Target>

							<Menu.Dropdown>
								<Menu.Label>Account</Menu.Label>
								<Menu.Item>
									<Text size="sm" fw={500}>
										{user.name}
									</Text>
									<Text size="xs" c="dimmed">
										{user.email}
									</Text>
								</Menu.Item>
								<Menu.Divider />
								<Menu.Item onClick={handleSignOut} color="red">
									Sign out
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>

						<Button
							onClick={() => {
								navigate({ to: "/tasks/new" });
							}}
						>
							New Task
						</Button>
					</>
				) : (
					<Button
						onClick={() => {
							navigate({ to: "/signin" });
						}}
					>
						Sign in
					</Button>
				)}
			</Group>
		</Group>
	);
}
