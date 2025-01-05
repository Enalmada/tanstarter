import { Trans } from "@lingui/react/macro";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Divider,
	Link as NextUILink,
} from "@nextui-org/react";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const { user } = Route.useRouteContext();

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

					{user ? (
						<div className="mt-6 flex flex-col gap-4">
							<p className="text-xl">Welcome back, {user.name}!</p>
							<div className="flex gap-2">
								<Button as={Link} to="/dashboard" color="primary" size="lg">
									<Trans>Go to Dashboard</Trans>
								</Button>

								<form
									method="POST"
									action="/api/auth/logout"
									className="inline-block"
								>
									<Button type="submit" color="danger" variant="flat" size="lg">
										Sign out
									</Button>
								</form>
							</div>

							<div className="mt-4">
								<p className="text-default-600">User data:</p>
								<pre className="mt-2 rounded-lg bg-default-100 p-4">
									{JSON.stringify(user, null, 2)}
								</pre>
							</div>
						</div>
					) : (
						<div className="mt-6 flex flex-col gap-4">
							<p className="text-xl text-default-600">You are not signed in.</p>
							<Button
								as={Link}
								to="/signin"
								color="primary"
								size="lg"
								className="w-fit"
							>
								Sign in
							</Button>
						</div>
					)}
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
