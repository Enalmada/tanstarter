import { Button, Heading, Link, Section, Text } from "@react-email/components";
import type { FC } from "react";
import { EmailLayout } from "./components/EmailLayout";

export interface AccountExistsEmailProps {
	appName: string;
	signInUrl: string;
	forgotPasswordUrl: string;
	supportEmail?: string | undefined;
}

/**
 * Sent when someone signs up with an address that already has an account. The sign-up page answers the same way
 * for every address, so this email is how the owner finds out.
 */
export const AccountExistsEmail: FC<AccountExistsEmailProps> = ({
	appName,
	signInUrl,
	forgotPasswordUrl,
	supportEmail,
}) => (
	<EmailLayout preview={`You already have a ${appName} account.`} appName={appName} supportEmail={supportEmail}>
		<Heading className="mb-4 text-2xl font-semibold text-gray-900">You already have an account</Heading>

		<Text className="text-base leading-relaxed text-gray-700">
			Someone tried to create a {appName} account with this email address, which already has one. Nothing was changed.
		</Text>

		<Section className="my-8">
			<Button
				href={signInUrl}
				className="inline-block rounded-md bg-brand px-6 py-3 text-base font-medium text-white no-underline"
			>
				Sign in
			</Button>
		</Section>

		<Text className="text-sm text-gray-600">
			Forgot your password?{" "}
			<Link href={forgotPasswordUrl} className="text-brand">
				Reset it
			</Link>
			.
		</Text>

		<Text className="mt-6 text-xs text-gray-500">If this wasn't you, you can ignore this email.</Text>
	</EmailLayout>
);
