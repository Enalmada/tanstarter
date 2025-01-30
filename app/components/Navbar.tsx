/**
 * Main navigation component
 * Handles user authentication state and navigation links
 * Includes responsive design with mobile menu
 */

import { Link, useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
	const navigate = useNavigate();

	// Pre-compute the avatar URL
	const avatarUrl =
		user?.image ?? (user?.email ? getGravatarUrl(user.email) : undefined);

	return (
		<div className="flex h-14 items-center justify-between border-0 border-b px-4">
			<Link to="/" className="text-2xl font-bold">
				TanStarter
			</Link>

			<div className="flex items-center gap-4">
				{user ? (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Avatar id="user-avatar" className="cursor-pointer">
									<AvatarImage src={avatarUrl} alt={user.name ?? ""} />
									<AvatarFallback>
										{user.name?.[0]?.toUpperCase() ?? "U"}
									</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>
									<div className="font-medium">{user.name}</div>
									<div className="text-xs text-muted-foreground">
										{user.email}
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem asChild>
										<Link to="/admin">Admin</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild className="text-destructive">
										<Link to="/signout">Sign out</Link>
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>

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
			</div>
		</div>
	);
}
