import { Trans } from "@lingui/react/macro";
import {
	Anchor,
	Button,
	Card,
	Divider,
	Group,
	Stack,
	Text,
} from "@mantine/core";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Home,
	beforeLoad: ({ context }) => {
		if (context.user) {
			throw redirect({ to: "/tasks" });
		}
		return { user: context.user };
	},
});

function Home() {
	return (
		<div className="container mx-auto flex flex-col gap-6 p-6">
			<Card withBorder>
				<Stack gap="md" p="md">
					<Text size="xl" fw={700}>
						TanStarter
					</Text>
					<Divider />
					<Group>
						<Text c="dimmed">Current location:</Text>
						<code className="rounded-md bg-default-100 px-2 py-1">
							routes/index.tsx
						</code>
					</Group>

					<Stack gap="md" mt="md">
						<Text size="lg" c="dimmed">
							Welcome to TanStarter Todo!
						</Text>
						<Button component={Link} to="/signin" size="lg" className="w-fit">
							Sign in to get started
						</Button>
					</Stack>
				</Stack>
			</Card>

			<Anchor
				href="https://github.com/dotnize/tanstarter"
				target="_blank"
				className="w-fit"
			>
				dotnize/tanstarter
			</Anchor>
		</div>
	);
}
