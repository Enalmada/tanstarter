import { createFileRoute, redirect } from "@tanstack/react-router";
import { UserRole } from "~/server/db/schema";
import { AdminLayout } from "../components/layouts/AdminLayout";

export const Route = createFileRoute("/admin")({
	component: AdminLayout,
	beforeLoad: async ({ context, location }) => {
		const user = context.user;

		// Check if user is authenticated
		if (!user) {
			throw redirect({
				to: "/signin",
				search: {
					returnTo: location.pathname,
				},
			});
		}

		// Check if user has admin role
		if (user.role !== UserRole.ADMIN) {
			throw redirect({
				to: "/tasks", // Redirect to main app
				search: {
					error: "Access denied. Admin privileges required.",
				},
			});
		}

		return { user };
	},
});
