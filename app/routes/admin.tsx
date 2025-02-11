import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "../components/layouts/AdminLayout";

export const Route = createFileRoute("/admin")({
	component: AdminLayout,
	beforeLoad: async ({ context }) => {
		const user = context.user;

		if (!user) {
			throw redirect({ to: "/signin" });
		}

		return { user };
	},
});
