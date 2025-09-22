import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
	component: AdminIndexComponent,
});

function AdminIndexComponent() {
	return (
		<div className="container mx-auto p-6">
			<h1 className="text-3xl font-bold tracking-tight">Welcome to Admin Dashboard</h1>
			<p className="text-muted-foreground mt-2">Select a section from the sidebar to get started.</p>
		</div>
	);
}
