import { Button, Heading, Section, Text } from "@react-email/components";
import type { FC } from "react";
import { EmailLayout } from "./components/EmailLayout";

export interface VerifyEmailProps {
	appName: string;
	verificationUrl: string;
	/** How long the link works, in minutes */
	linkValidMinutes: number;
	supportEmail?: string | undefined;
}

export const VerifyEmail: FC<VerifyEmailProps> = ({ appName, verificationUrl, linkValidMinutes, supportEmail }) => (
	<EmailLayout preview={`Confirm your email address for ${appName}.`} appName={appName} supportEmail={supportEmail}>
		<Heading className="mb-4 text-2xl font-semibold text-gray-900">Confirm your email</Heading>

		<Text className="text-base leading-relaxed text-gray-700">
			Use the button below to confirm this address and finish creating your account. The link works for{" "}
			{linkValidMinutes} minutes.
		</Text>

		<Section className="my-8">
			<Button
				href={verificationUrl}
				className="inline-block rounded-md bg-brand px-6 py-3 text-base font-medium text-white no-underline"
			>
				Confirm email
			</Button>
		</Section>

		<Text className="text-sm text-gray-600">
			If the button doesn't work, copy and paste this link into your browser:
		</Text>
		<Text className="text-sm text-gray-600">{verificationUrl}</Text>

		<Text className="mt-6 text-xs text-gray-500">If you didn't create an account, you can ignore this email.</Text>
	</EmailLayout>
);
