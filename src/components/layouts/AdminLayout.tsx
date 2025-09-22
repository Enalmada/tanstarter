import { Link, Outlet } from "@tanstack/react-router";
import { ListTodo, Mail, Menu, Users } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

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
	const [open, setOpen] = useState(false);

	return (
		<div className="relative flex min-h-screen flex-col">
			{/* Header */}
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
				<div className="container flex h-14 items-center">
					<Sheet open={open} onOpenChange={setOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
							>
								<Menu className="h-5 w-5" />
								<span className="sr-only">Toggle Menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="pr-0">
							<MobileNav />
						</SheetContent>
					</Sheet>
					<div className="flex flex-1 items-center justify-between">
						<div className="font-medium">Admin Dashboard</div>
						<div>
							<ThemeToggle />

							<Button variant="ghost" asChild>
								<Link to="/tasks">App</Link>
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
				<aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
					<ScrollArea className="py-6 pr-6 lg:py-8">
						<SideNav />
					</ScrollArea>
				</aside>
				<main className="flex w-full flex-col overflow-hidden">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

function MobileNav() {
	return (
		<ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
			<div className="flex flex-col space-y-2">
				{navItems.map((item) => (
					<Button key={item.to} variant="ghost" className="w-full justify-start" asChild>
						<Link to={item.to}>
							<item.icon className="mr-2 h-4 w-4" />
							{item.label}
						</Link>
					</Button>
				))}
			</div>
		</ScrollArea>
	);
}

function SideNav() {
	return (
		<div className="flex flex-col space-y-1">
			{navItems.map((item) => (
				<Button
					key={item.to}
					variant="ghost"
					className={cn("w-full justify-start", "data-active:bg-accent data-active:text-accent-foreground")}
					asChild
				>
					<Link to={item.to}>
						<item.icon className="mr-2 h-4 w-4" />
						{item.label}
					</Link>
				</Button>
			))}
		</div>
	);
}
