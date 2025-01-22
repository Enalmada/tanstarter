import { createFileRoute, redirect } from "@tanstack/react-router";
import { queries } from "~/utils/query/queries";
import { AdminLayout } from "../components/layouts/AdminLayout";

export const Route = createFileRoute("/admin")({
	component: AdminLayout,
	beforeLoad: async ({ context }) => {
		const queryClient = context.queryClient;
		let user = null;

		try {
			user = await queryClient.ensureQueryData(queries.user.session);
		} catch (error) {
			// Handle error silently
		}

		if (!user) {
			throw redirect({ to: "/signin" });
		}

		return { user };
	},
});
