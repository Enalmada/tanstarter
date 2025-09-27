import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { DefaultLayout } from "~/components/layouts/DefaultLayout";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Container } from "~/components/ui/container";

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
			<div className="flex flex-col gap-12 py-12">
				{/* Hero Section */}
				<div className="flex flex-col items-center gap-4 text-center">
					<h1 className="text-4xl font-bold tracking-tight">TanStarter Todo</h1>
					<p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
						A modern, type-safe todo application built with TanStack Start.
					</p>
					<div className="flex gap-4 mt-4">
						<Button asChild size="lg">
							<Link to="/tasks">Get Started</Link>
						</Button>
						<Button asChild variant="outline" size="lg" className="bg-accent/10 hover:bg-accent/20">
							<a href="https://github.com/Enalmada/tanstarter" target="_blank" rel="noopener noreferrer">
								View on GitHub
							</a>
						</Button>
					</div>
				</div>

				{/* Features Section */}
				<div className="flex flex-col gap-8">
					<h2 className="text-3xl font-bold tracking-tight text-center">Features</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Type Safety</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									End-to-end type safety with TypeScript, Drizzle ORM, and Valibot validation.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Modern Stack</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Built with TanStack Start, TanStack Query, TanStack Table, and shadcn/ui components.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Great DX</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">Fast refresh, automatic type generation, and error handling.</p>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Tech Stack Section */}
				<div className="flex flex-col gap-8">
					<h2 className="text-3xl font-bold tracking-tight text-center">Tech Stack</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Frontend</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									React, TanStack Router, TanStack Query, shadcn/ui with modals, Tailwind CSS, and Lingui i18n
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Backend</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									TanStack Start, Drizzle ORM, PostgreSQL, Better Auth, and CASL authorization
								</p>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Image Optimization Demo Section */}
				<div className="flex flex-col gap-8">
					<h2 className="text-3xl font-bold tracking-tight text-center">Image Optimization Demo</h2>
					<Card className="mx-auto p-8">
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
						<p className="text-sm text-muted-foreground text-center mt-4">
							Image optimized with Unpic - Responsive, lazy-loaded, and CDN-powered
						</p>
					</Card>
				</div>

				{/* Error Monitoring Section */}
				<div className="flex flex-col gap-8">
					<h2 className="text-3xl font-bold tracking-tight text-center">Error Monitoring</h2>
					<Card>
						<CardContent className="flex flex-col items-center gap-4 pt-6">
							<p className="text-muted-foreground text-center">
								Test the error monitoring system with various scenarios including error boundaries, uncaught errors,
								async errors, and user context tracking.
							</p>
							<Button asChild>
								<Link to="/debug/monitoring">Test Error Monitoring</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</Container>
	);
}
