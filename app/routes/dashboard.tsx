import { Button, Card, CardBody } from "@nextui-org/react";
import {
	Link,
	Outlet,
	createFileRoute,
	redirect,
} from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
	component: DashboardLayout,
	beforeLoad: async ({ context }) => {
		if (!context.user) {
			throw redirect({ to: "/signin" });
		}
	},
});

function DashboardLayout() {
	return (
		<div className="container mx-auto flex flex-col gap-4 p-6">
			<Card>
				<CardBody>
					<h1 className="text-4xl font-bold">Dashboard</h1>
					<div className="mt-4 flex items-center gap-2">
						<span className="text-default-600">Current location:</span>
						<code className="rounded-md bg-default-100 px-2 py-1">
							routes/dashboard.tsx
						</code>
					</div>

					<Button as={Link} to="/" color="primary" className="mt-4" size="lg">
						Back to Home
					</Button>
				</CardBody>
			</Card>

			<Card>
				<CardBody>
					<Outlet />
				</CardBody>
			</Card>
		</div>
	);
}
