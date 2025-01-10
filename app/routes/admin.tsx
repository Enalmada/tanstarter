import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "../components/layouts/AdminLayout";

export const Route = createFileRoute("/admin")({
	component: AdminComponent,
});

function AdminComponent() {
	return <AdminLayout />;
}
