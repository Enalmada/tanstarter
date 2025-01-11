import { Container, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

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
