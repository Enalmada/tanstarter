import { Body, Container, Head, Html, Preview, Section, Tailwind, Text } from "@react-email/components";
import { pixelBasedPreset } from "@react-email/tailwind";
import type { FC, PropsWithChildren } from "react";

interface EmailLayoutProps {
	preview: string;
	supportEmail?: string;
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
	supportEmail = "support@tanstarter.dev",
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
							<Text className="m-0 text-xl font-semibold text-white">TanStarter</Text>
						</Section>
						{/* biome-ignore lint/suspicious/noExplicitAny: Required for ReactNode type compatibility */}
						<Section className="px-6 py-8 text-gray-800">{children as any}</Section>
						<Section className="border-t border-gray-200 px-6 py-4 text-xs text-gray-500">
							<Text className="m-0">
								You received this email because you have an account with TanStarter. If you have questions, contact us
								at {supportEmail}.
							</Text>
						</Section>
					</Section>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);
