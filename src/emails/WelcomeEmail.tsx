import { Button, Heading, Link, Section, Text } from "@react-email/components";
import type { FC } from "react";
import { EmailLayout } from "./components/EmailLayout";

export interface WelcomeEmailProps {
	username?: string;
	gettingStartedUrl: string;
	supportEmail: string;
}

export const WelcomeEmail: FC<WelcomeEmailProps> = ({ username, gettingStartedUrl, supportEmail }) => (
	<EmailLayout preview="Welcome to our platform! Get started with your new account." supportEmail={supportEmail}>
		<Heading className="mb-4 text-2xl font-semibold text-gray-900">
			{username ? `Welcome ${username}!` : "Welcome!"}
		</Heading>

		<Text className="text-base leading-relaxed text-gray-700">
			{username ? `Hi ${username},` : "Hi,"}
			<br />
			<br />
			We're thrilled to have you on board. Your account has been successfully created and you're ready to get started.
		</Text>

		<Section className="my-6">
			<Text className="text-sm font-semibold uppercase tracking-wide text-gray-700">Next steps</Text>
			<ul className="mb-0 mt-2 pl-6">
				<li className="mb-2 text-sm text-gray-600">Complete your profile</li>
				<li className="mb-2 text-sm text-gray-600">Explore the dashboard</li>
				<li className="mb-2 text-sm text-gray-600">Create your first project</li>
			</ul>
		</Section>

		<Section className="my-8">
			<Button
				href={gettingStartedUrl}
				className="inline-block rounded-md bg-brand px-6 py-3 text-base font-medium text-white no-underline"
			>
				Get Started
			</Button>
		</Section>

		<Text className="text-sm text-gray-600">
			If the button doesn't work, copy and paste this link into your browser:
		</Text>
		<Text className="text-sm text-gray-600">{gettingStartedUrl}</Text>

		<Text className="mt-6 text-xs text-gray-500">
			Need help? Reply to this email or contact us at{" "}
			<Link href={`mailto:${supportEmail}`} className="text-brand no-underline">
				{supportEmail}
			</Link>
		</Text>
	</EmailLayout>
);

export default WelcomeEmail;
