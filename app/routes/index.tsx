import { createFileRoute } from "@tanstack/react-router";
import { DefaultLayout } from "~/components/layouts/DefaultLayout";
import {
	Anchor,
	Card,
	Container,
	Group,
	LinkButton,
	Stack,
	Text,
	Title,
} from "~/components/ui";

export const Route = createFileRoute("/")({
	component: HomeLayout,
	loader: ({ context }) => ({
		user: context.user ?? null,
	}),
});

function HomeLayout() {
	const { user } = Route.useLoaderData();
	return (
		<DefaultLayout user={user}>
			<Home />
		</DefaultLayout>
	);
}

function Home() {
	return (
		<Container size="lg">
			<Stack gap="xl" py="xl">
				{/* Hero Section */}
				<Stack ta="center" gap="md">
					<Title size="h1">TanStarter Todo</Title>
					<Text c="dimmed" size="xl" maw={600} mx="auto">
						A modern, type-safe todo application built with TanStack Start.
					</Text>
					<Group justify="center" mt="md">
						<LinkButton to="/tasks" size="lg">
							Get Started
						</LinkButton>
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
									Built with TanStack Start, TanStack Query, TanStack Table, and
									Mantine UI components.
								</Text>
							</Stack>
						</Card>
						<Card withBorder>
							<Stack>
								<Title order={3} size="h4">
									Great DX
								</Title>
								<Text c="dimmed">
									Fast refresh, automatic type generation, and error handling.
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
									React, TanStack Router, TanStack Query, Mantine UI with
									modals, Tailwind CSS, and Lingui i18n
								</Text>
							</Stack>
						</Card>
						<Card withBorder>
							<Stack>
								<Title order={3} size="h4">
									Backend
								</Title>
								<Text c="dimmed">
									TanStack Start, Drizzle ORM, PostgreSQL, Better Auth, and CASL
									authorization
								</Text>
							</Stack>
						</Card>
					</Group>
				</Stack>
			</Stack>
		</Container>
	);
}
