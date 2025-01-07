/**
 * Main navigation component
 * Handles user authentication state and navigation links
 * Includes responsive design with mobile menu
 */

import {
	Avatar,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	NavbarBrand,
	NavbarContent,
	Link as NextUILink,
	Navbar as NextUINavbar,
} from "@nextui-org/react";
import { Link } from "@tanstack/react-router";
import type { ClientUser } from "~/server/db/schema";

interface NavbarProps {
	user?: ClientUser | null;
}

export function Navbar({ user }: NavbarProps) {
	return (
		<NextUINavbar>
			<NavbarBrand>
				<NextUILink
					as={Link}
					to="/"
					color="foreground"
					className="font-bold text-inherit"
				>
					TanStarter
				</NextUILink>
			</NavbarBrand>

			<NavbarContent justify="end">
				{user ? (
					<Dropdown placement="bottom-end">
						<DropdownTrigger>
							<Avatar
								as="button"
								className="transition-transform"
								color="primary"
								size="sm"
								{...(user.name && { name: user.name })}
								{...(user.avatar_url && { src: user.avatar_url })}
							/>
						</DropdownTrigger>
						<DropdownMenu aria-label="Profile Actions" variant="flat">
							<DropdownItem key="profile" className="h-14 gap-2">
								<p className="font-semibold">Signed in as</p>
								<p className="font-semibold">{user.email}</p>
							</DropdownItem>
							<DropdownItem key="logout">
								<form
									method="POST"
									action="/api/auth/logout"
									className="w-full"
								>
									<Button
										type="submit"
										color="danger"
										variant="light"
										className="w-full"
									>
										Sign out
									</Button>
								</form>
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				) : (
					<Button as={Link} color="primary" to="/signin" variant="flat">
						Sign in
					</Button>
				)}
			</NavbarContent>
		</NextUINavbar>
	);
}
