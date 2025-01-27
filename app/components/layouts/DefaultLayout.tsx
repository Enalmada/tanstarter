import { cn } from "@/lib/utils";
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
		<div className="relative min-h-screen flex flex-col">
			<header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="h-[60px]">
					<Navbar user={user} />
				</div>
			</header>

			<main className="flex-1">
				<div className={cn("min-h-[calc(100vh-222px)]")}>
					{children ?? <Outlet />}
				</div>
				<Footer />
			</main>
		</div>
	);
}
