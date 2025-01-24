import { AppShell } from "@mantine/core";
import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/marketing/Footer";
import type { SessionUser } from "~/utils/auth-client";

interface DefaultLayoutProps {
	user: SessionUser | null;
	children?: ReactNode;
}

export function DefaultLayout({ user, children }: DefaultLayoutProps) {
	return (
		<AppShell header={{ height: 60 }}>
			<AppShell.Header>
				<Navbar user={user} />
			</AppShell.Header>
			<AppShell.Main>{children ?? <Outlet />}</AppShell.Main>
			<Footer />
		</AppShell>
	);
}
