import { render } from "@react-email/render";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
			className="w-full h-[600px] border-none"
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
		<div className="flex flex-col gap-8">
			<h2 className="text-3xl font-bold tracking-tight">
				Welcome Email Template
			</h2>

			<Card>
				<Suspense fallback={<div>Loading email preview...</div>}>
					<EmailPreview />
				</Suspense>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Test Email</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid w-full max-w-sm items-center gap-1.5">
						<Label htmlFor="email">Email Address</Label>
						<Input
							type="email"
							id="email"
							placeholder="Enter email to test"
							value={testEmail}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setTestEmail(e.target.value)
							}
						/>
					</div>
					<Button
						disabled={!testEmail || sending}
						onClick={() => {
							// TODO: Implement email sending
							alert("Email sending will be implemented in the next step");
						}}
					>
						{sending ? (
							<>
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								<span className="ml-2">Sending...</span>
							</>
						) : (
							"Send Test Email"
						)}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
