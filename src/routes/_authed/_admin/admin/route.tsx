import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "~/components/layouts/AdminLayout";

export const Route = createFileRoute("/_authed/_admin/admin")({
	component: AdminLayout,
});
