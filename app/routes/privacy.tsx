import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPolicy,
});

function PrivacyPolicy() {
	return (
		<div className="@auto dark:bg-neutral-900 p-6 prose">
			<h1>Privacy Policy</h1>
			<h2>Data Collection</h2>
			<p>We collect:</p>
			<ul>
				<li>Email addresses for auth</li>
				<li>Task content (encrypted at rest)</li>
				<li>Usage analytics via Posthog</li>
			</ul>
			<h2>Third Parties</h2>
			<p>Data shared with:</p>
			<ul>
				<li>Neon PostgreSQL (database)</li>
				<li>Vercel (hosting)</li>
				<li>Posthog (analytics)</li>
			</ul>
			<h2>User Rights</h2>
			<p>You may:</p>
			<ul>
				<li>Export your data</li>
				<li>Delete your account</li>
				<li>Opt-out of analytics</li>
			</ul>
		</div>
	);
}
