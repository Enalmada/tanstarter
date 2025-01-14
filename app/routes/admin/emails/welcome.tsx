import { Button, Card, Stack, TextInput, Title } from "@mantine/core";
import { render } from "@react-email/render";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import WelcomeEmail from "~/emails/WelcomeEmail";

const emailQueries = {
	welcomePreview: {
		queryKey: ["emails", "welcome", "preview"],
		queryFn: async () => {
			const html = await render(<WelcomeEmail />);
			return html;
		},
	},
} as const;

function EmailPreview() {
	const { data: emailHtml } = useSuspenseQuery(emailQueries.welcomePreview);

	return (
		<iframe
			title="Email Preview"
			srcDoc={emailHtml}
			style={{
				width: "100%",
				height: "600px",
				border: "none",
			}}
		/>
	);
}

export const Route = createFileRoute("/admin/emails/welcome")({
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(emailQueries.welcomePreview),
	component: WelcomeEmailPreview,
});

function WelcomeEmailPreview() {
	const [testEmail, setTestEmail] = useState("");
	const [sending, setSending] = useState(false);

	return (
		<Stack gap="lg">
			<Title order={2}>Welcome Email Template</Title>

			<Card withBorder>
				<Suspense fallback={<div>Loading email preview...</div>}>
					<EmailPreview />
				</Suspense>
			</Card>

			<Card withBorder>
				<Stack gap="md">
					<Title order={3}>Test Email</Title>
					<TextInput
						label="Email Address"
						placeholder="Enter email to test"
						value={testEmail}
						onChange={(e) => setTestEmail(e.currentTarget.value)}
					/>
					<Button
						loading={sending}
						disabled={!testEmail}
						onClick={() => {
							// TODO: Implement email sending
							alert("Email sending will be implemented in the next step");
						}}
					>
						Send Test Email
					</Button>
				</Stack>
			</Card>
		</Stack>
	);
}
