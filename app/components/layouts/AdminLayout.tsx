import {
	AppShell,
	Burger,
	Button,
	Group,
	NavLink,
	ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Outlet } from "@tanstack/react-router";
import { ListTodo, Mail, Users } from "lucide-react";

const navItems = [
	{
		label: "Users",
		icon: Users,
		to: "/admin/users",
	},
	{
		label: "Tasks",
		icon: ListTodo,
		to: "/admin/tasks",
	},
	{
		label: "Emails",
		icon: Mail,
		to: "/admin/emails/welcome",
	},
];

export function AdminLayout() {
	const [opened, { toggle }] = useDisclosure();

	return (
		<div suppressHydrationWarning>
			<AppShell
				header={{ height: 60 }}
				navbar={{
					width: 300,
					breakpoint: "sm",
					collapsed: { mobile: !opened },
				}}
				padding="md"
			>
				<AppShell.Header>
					<Group h="100%" px="md">
						<Burger
							opened={opened}
							onClick={toggle}
							hiddenFrom="sm"
							size="sm"
						/>
						<Group justify="space-between" style={{ flex: 1 }}>
							<div>Admin Dashboard</div>
							<Button component={Link} to="/tasks" variant="subtle">
								App
							</Button>
						</Group>
					</Group>
				</AppShell.Header>

				<AppShell.Navbar p="md">
					<ScrollArea>
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								label={item.label}
								leftSection={<item.icon size={20} />}
								component={Link}
								to={item.to}
								variant="light"
								active={false}
							/>
						))}
					</ScrollArea>
				</AppShell.Navbar>

				<AppShell.Main>
					<Outlet />
				</AppShell.Main>
			</AppShell>
		</div>
	);
}
