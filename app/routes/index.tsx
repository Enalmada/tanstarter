import { createFileRoute } from "@tanstack/react-router";
import { Image } from "@unpic/react";
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

				{/* Image Optimization Demo Section */}
				<Stack gap="lg" mt="xl">
					<Title order={2} ta="center">
						Image Optimization Demo
					</Title>
					<Card withBorder mx="auto" p="xl">
						<Image
							src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba"
							layout="constrained"
							width={800}
							height={400}
							alt="Scenic mountain landscape"
							priority={true}
							loading="eager"
							background="auto"
							breakpoints={[320, 640, 960, 1280]}
							className="rounded-lg"
						/>
						<Text size="sm" c="dimmed" ta="center" mt="md">
							Image optimized with Unpic - Responsive, lazy-loaded, and
							CDN-powered
						</Text>
					</Card>
				</Stack>

				{/* Error Monitoring Section */}
				<Stack gap="lg" mt="xl">
					<Title order={2} ta="center">
						Error Monitoring
					</Title>
					<Card withBorder>
						<Stack align="center" gap="md">
							<Text c="dimmed" ta="center">
								Test the error monitoring system with various scenarios
								including error boundaries, uncaught errors, async errors, and
								user context tracking.
							</Text>
							<LinkButton to="/debug/monitoring" size="md">
								Test Error Monitoring
							</LinkButton>
						</Stack>
					</Card>
				</Stack>
			</Stack>
		</Container>
	);
}
