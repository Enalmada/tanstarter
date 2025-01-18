/**
 * Main navigation component
 * Handles user authentication state and navigation links
 * Includes responsive design with mobile menu
 */

import { Avatar, Button, Group, Menu, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { SessionUser } from "~/utils/auth-client";
import authClient from "~/utils/auth-client";

interface NavbarProps {
	user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const handleSignOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					queryClient.clear();
					navigate({ to: "/" });
				},
			},
		});
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
									src={
										user.image ??
										`https://www.gravatar.com/avatar/${btoa(user.email)}?d=mp`
									}
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
								<Menu.Item component={Link} to="/admin">
									Admin
								</Menu.Item>
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
