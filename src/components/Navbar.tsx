/**
 * Main navigation component
 * Handles user authentication state and navigation links
 * Includes responsive design with mobile menu
 */

import { Link } from "@tanstack/react-router";
import { useId } from "react";
import ThemeToggle from "~/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { buttonVariants } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UserRole } from "~/server/db/schema";
import type { SessionUser } from "~/utils/auth-client";

// Move this outside component to ensure consistent hash generation
function getGravatarUrl(email: string) {
	// Use a more consistent way to generate hash for Gravatar
	const hash = email
		.trim()
		.toLowerCase()
		.split("")
		.map((char) => char.charCodeAt(0).toString(16))
		.join("");

	return `https://www.gravatar.com/avatar/${hash}?d=mp`;
}

interface NavbarProps {
	user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
	const avatarId = useId();

	// Pre-compute the avatar URL
	const avatarUrl = user?.image ?? (user?.email ? getGravatarUrl(user.email) : undefined);

	return (
		<div className="flex h-14 items-center justify-between border-0 border-b px-4 bg-white dark:bg-background">
			<Link to="/" className="text-2xl font-bold">
				TanStarter
			</Link>

			<div className="flex items-center gap-4">
				<ThemeToggle />

				{user ? (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger id={avatarId} className="cursor-pointer rounded-full">
								<Avatar>
									<AvatarImage src={avatarUrl} alt={user.name ?? ""} />
									<AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuGroup>
									<DropdownMenuLabel>
										<div className="font-medium">{user.name}</div>
										<div className="text-xs text-muted-foreground">{user.email}</div>
									</DropdownMenuLabel>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem render={<Link to="/profile" />}>Profile</DropdownMenuItem>
									{user.role === UserRole.ADMIN && (
										<DropdownMenuItem render={<Link to="/admin" />}>Admin</DropdownMenuItem>
									)}
									<DropdownMenuItem className="text-destructive" render={<Link to="/signout" />}>
										Sign out
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>

						<Link to="/tasks/new" className={buttonVariants()}>
							New Task
						</Link>
					</>
				) : (
					<Link to="/signin" className={buttonVariants()}>
						Sign in
					</Link>
				)}
			</div>
		</div>
	);
}
