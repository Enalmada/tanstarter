import { Button, Card, Divider, Stack, Text } from "@mantine/core";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signin")({
	component: AuthPage,
	beforeLoad: async ({ context }) => {
		if (context.user) {
			throw redirect({
				to: "/tasks",
			});
		}
	},
});

function AuthPage() {
	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Card withBorder>
				<Stack gap="md" p="md">
					<Text size="xl" fw={700}>
						Sign in
					</Text>
					<Divider />
					<form
						method="GET"
						action="/api/auth/google"
						className="flex flex-col gap-4"
					>
						<Button type="submit" size="lg">
							Continue with Google
						</Button>
					</form>
				</Stack>
			</Card>
		</div>
	);
}
