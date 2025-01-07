import { Trans } from "@lingui/react/macro";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Divider,
	Link as NextUILink,
} from "@nextui-org/react";
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
			<Card>
				<CardHeader>
					<h1 className="text-4xl font-bold">TanStarter</h1>
				</CardHeader>
				<Divider />
				<CardBody>
					<div className="flex items-center gap-2">
						<span className="text-default-600">Current location:</span>
						<code className="rounded-md bg-default-100 px-2 py-1">
							routes/index.tsx
						</code>
					</div>

					<div className="mt-6 flex flex-col gap-4">
						<p className="text-xl text-default-600">
							Welcome to TanStarter Todo!
						</p>
						<Button
							as={Link}
							to="/signin"
							color="primary"
							size="lg"
							className="w-fit"
						>
							Sign in to get started
						</Button>
					</div>
				</CardBody>
			</Card>

			<NextUILink
				isExternal
				showAnchorIcon
				href="https://github.com/dotnize/tanstarter"
				color="foreground"
				className="w-fit"
			>
				dotnize/tanstarter
			</NextUILink>
		</div>
	);
}
