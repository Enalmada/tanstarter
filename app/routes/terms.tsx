import { createFileRoute } from "@tanstack/react-router";
import { DefaultLayout } from "~/components/layouts/DefaultLayout";

export const Route = createFileRoute("/terms")({
	component: TermsOfService,
	loader: ({ context }) => ({
		user: context.user ?? null,
	}),
});

function TermsOfService() {
	const { user } = Route.useLoaderData();
	return (
		<DefaultLayout user={user}>
			<div className="@auto dark:bg-neutral-900 p-6 prose">
				<h1>Terms of Service</h1>
				<h2>1. Acceptance of Terms</h2>
				<p>
					By accessing our todo app, you agree to these terms. Our service
					provides:
				</p>
				<ul>
					<li>Task management capabilities</li>
					<li>Collaborative features</li>
					<li>Secure cloud storage</li>
				</ul>
				<h2>2. User Responsibilities</h2>
				<p>You agree not to:</p>
				<ul>
					<li>Violate any laws</li>
					<li>Reverse engineer the service</li>
					<li>Spam other users</li>
				</ul>
				<h2>3. Termination</h2>
				<p>We may suspend accounts for:</p>
				<ul>
					<li>Abuse of API endpoints</li>
					<li>Storage quota violations</li>
					<li>Security breaches</li>
				</ul>
			</div>
		</DefaultLayout>
	);
}
