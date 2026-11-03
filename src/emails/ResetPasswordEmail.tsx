import { Button, Heading, Section, Text } from "@react-email/components";
import type { FC } from "react";
import { EmailLayout } from "./components/EmailLayout";

export interface ResetPasswordEmailProps {
	appName: string;
	resetUrl: string;
	/** How long the link works, in minutes */
	linkValidMinutes: number;
	supportEmail?: string | undefined;
}

export const ResetPasswordEmail: FC<ResetPasswordEmailProps> = ({
	appName,
	resetUrl,
	linkValidMinutes,
	supportEmail,
}) => (
	<EmailLayout preview={`Choose a new password for ${appName}.`} appName={appName} supportEmail={supportEmail}>
		<Heading className="mb-4 text-2xl font-semibold text-gray-900">Reset your password</Heading>

		<Text className="text-base leading-relaxed text-gray-700">
			Use the button below to choose a new password. The link works once, for {linkValidMinutes} minutes. Resetting
			signs you out everywhere.
		</Text>

		<Section className="my-8">
			<Button
				href={resetUrl}
				className="inline-block rounded-md bg-brand px-6 py-3 text-base font-medium text-white no-underline"
			>
				Choose a new password
			</Button>
		</Section>

		<Text className="text-sm text-gray-600">
			If the button doesn't work, copy and paste this link into your browser:
		</Text>
		<Text className="text-sm text-gray-600">{resetUrl}</Text>

		<Text className="mt-6 text-xs text-gray-500">
			If you didn't ask for this, you can ignore this email. Your password has not changed.
		</Text>
	</EmailLayout>
);
