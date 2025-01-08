import { Button, Center, Group, Loader, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

export function TaskListSkeleton() {
	return (
		<div className="container mx-auto p-6">
			<Group justify="space-between" mb="xl">
				<Text size="xl" fw={700}>
					Tasks
				</Text>
				<Button component={Link} to="/tasks/new" size="lg">
					New Task
				</Button>
			</Group>
			<Center>
				<Loader size="md" />
			</Center>
		</div>
	);
}
