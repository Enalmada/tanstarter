import { AppShell } from "@mantine/core";
import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Navbar } from "~/components/Navbar";
import type { ClientUser } from "~/server/db/schema";

interface DefaultLayoutProps {
	user: ClientUser | null;
	children?: ReactNode;
}

export function DefaultLayout({ user, children }: DefaultLayoutProps) {
	return (
		<AppShell header={{ height: 60 }}>
			<AppShell.Header>
				<Navbar user={user} />
			</AppShell.Header>
			<AppShell.Main>{children ?? <Outlet />}</AppShell.Main>
		</AppShell>
	);
}
