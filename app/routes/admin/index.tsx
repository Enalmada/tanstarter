import { createFileRoute } from "@tanstack/react-router";
import { Container } from "~/components/ui/Container";
import { Title } from "~/components/ui/Title";

export const Route = createFileRoute("/admin/")({
	component: AdminIndexComponent,
});

function AdminIndexComponent() {
	return (
		<Container>
			<Title>Welcome to Admin Dashboard</Title>
			<p>Select a section from the sidebar to get started.</p>
		</Container>
	);
}
