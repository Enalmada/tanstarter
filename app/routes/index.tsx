import {
	Anchor,
	Button,
	Card,
	Container,
	Group,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<Container size="lg">
			<Stack gap="xl" py="xl">
				{/* Hero Section */}
				<Stack ta="center" gap="md">
					<Title size="h1">TanStarter Todo</Title>
					<Text size="xl" c="dimmed" maw={600} mx="auto">
						A modern, type-safe todo application built with TanStack Router,
						React Query, and PostgreSQL.
					</Text>
					<Group justify="center" mt="md">
						<Button
							component={Link}
							to="/tasks"
							size="lg"
							variant="gradient"
							gradient={{ from: "blue", to: "cyan" }}
						>
							Get Started
						</Button>
						<Anchor
							href="https://github.com/dotnize/tanstarter"
							target="_blank"
							size="lg"
							className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
						>
							View on GitHub
						</Anchor>
					</Group>
				</Stack>

				{/* Features Section */}
				<Stack gap="lg" mt="xl">
					<Title order={2} ta="center">
						Features
					</Title>
					<Group grow>
						<Card withBorder>
							<Stack>
								<Title order={3} size="h4">
									Type Safety
								</Title>
								<Text c="dimmed">
									End-to-end type safety with TypeScript, Drizzle ORM, and
									Valibot validation.
								</Text>
							</Stack>
						</Card>
						<Card withBorder>
							<Stack>
								<Title order={3} size="h4">
									Modern Stack
								</Title>
								<Text c="dimmed">
									Built with TanStack Router, React Query, and Mantine UI
									components.
								</Text>
							</Stack>
						</Card>
						<Card withBorder>
							<Stack>
								<Title order={3} size="h4">
									Great DX
								</Title>
								<Text c="dimmed">
									Fast refresh, automatic type generation, and excellent error
									handling.
								</Text>
							</Stack>
						</Card>
					</Group>
				</Stack>

				{/* Tech Stack Section */}
				<Stack gap="lg" mt="xl">
					<Title order={2} ta="center">
						Tech Stack
					</Title>
					<Group grow>
						<Card withBorder>
							<Stack>
								<Title order={3} size="h4">
									Frontend
								</Title>
								<Text c="dimmed">
									React, TanStack Router, TanStack Query, Mantine UI, Tailwind
									CSS
								</Text>
							</Stack>
						</Card>
						<Card withBorder>
							<Stack>
								<Title order={3} size="h4">
									Backend
								</Title>
								<Text c="dimmed">
									TanStack Start, Drizzle ORM, PostgreSQL, Google OAuth
								</Text>
							</Stack>
						</Card>
					</Group>
				</Stack>
			</Stack>
		</Container>
	);
}
