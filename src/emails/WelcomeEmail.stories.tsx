import { render } from "@react-email/components";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef } from "react";
import { WelcomeEmail } from "./WelcomeEmail";

interface EmailPreviewProps {
	username?: string;
}

function EmailPreview({ username = "there" }: EmailPreviewProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const renderEmail = async () => {
			if (!iframeRef.current) return;

			const html = await render(<WelcomeEmail username={username} />, {
				pretty: true,
			});

			const iframeDoc = iframeRef.current?.contentDocument;
			if (iframeDoc) {
				iframeDoc.open();
				iframeDoc.write(html);
				iframeDoc.close();
			}
		};

		renderEmail();
	}, [username]);

	return (
		<div className="w-full h-screen">
			<iframe ref={iframeRef} title="Email Preview" className="w-full h-full border-0" style={{ minHeight: "600px" }} />
		</div>
	);
}

const meta = {
	title: "Emails/WelcomeEmail",
	component: EmailPreview,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		backgrounds: {
			default: "light",
		},
	},
	argTypes: {
		username: {
			control: "text",
			description: "The username to display in the welcome message",
		},
	},
} satisfies Meta<typeof EmailPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		username: "there",
	},
};

export const WithUsername: Story = {
	args: {
		username: "John",
	},
};

export const LongUsername: Story = {
	args: {
		username: "Alexandra Thompson-Williams",
	},
};
