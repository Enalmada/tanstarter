import { Container, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/tasks/")({
	component: TasksComponent,
});

function TasksComponent() {
	return (
		<Container>
			<Title>Tasks</Title>
			<p>Tasks management coming soon...</p>
		</Container>
	);
}
