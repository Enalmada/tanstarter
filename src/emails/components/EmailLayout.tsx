import { Body, Container, Head, Html, Link, Preview, Section, Tailwind, Text } from "@react-email/components";
import { pixelBasedPreset } from "@react-email/tailwind";
import type { FC, PropsWithChildren } from "react";

export interface EmailLayoutProps {
	/** Text shown in email client preview (before opening) */
	preview: string;
	/** App/brand name shown in header and footer */
	appName: string;
	/** Support email address (required for compliance) */
	supportEmail: string;
	/** Unsubscribe URL for email compliance (CAN-SPAM, GDPR) */
	unsubscribeUrl?: string;
}

const tailwindConfig = {
	presets: [pixelBasedPreset],
	theme: {
		extend: {
			colors: {
				brand: "#228be6",
				gray: {
					50: "#f8fafc",
					100: "#f1f5f9",
					200: "#e2e8f0",
					300: "#cbd5e1",
					400: "#94a3b8",
					500: "#64748b",
					600: "#475569",
					700: "#334155",
					800: "#1e293b",
					900: "#0f172a",
				},
			},
		},
	},
};

export const EmailLayout: FC<PropsWithChildren<EmailLayoutProps>> = ({
	preview,
	appName,
	supportEmail,
	unsubscribeUrl,
	children,
}) => (
	<Html lang="en">
		<Head />
		<Preview>{preview}</Preview>
		<Tailwind config={tailwindConfig}>
			<Body className="bg-gray-50 font-sans">
				<Container className="mx-auto max-w-[580px] py-10">
					<Section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
						<Section className="bg-gray-900 px-6 py-5">
							<Text className="m-0 text-xl font-semibold text-white">{appName}</Text>
						</Section>
						{/* biome-ignore lint/suspicious/noExplicitAny: Required for ReactNode type compatibility */}
						<Section className="px-6 py-8 text-gray-800">{children as any}</Section>
						<Section className="border-t border-gray-200 px-6 py-4 text-xs text-gray-500">
							<Text className="m-0">
								You received this email because you have an account with {appName}. If you have questions, contact us at{" "}
								{supportEmail}.
							</Text>
							{unsubscribeUrl && (
								<Text className="m-0 mt-2">
									<Link href={unsubscribeUrl} className="text-gray-500 underline">
										Unsubscribe
									</Link>{" "}
									from these emails.
								</Text>
							)}
						</Section>
					</Section>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);
