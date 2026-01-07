import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { welcomeEmailPreview } from "./preview-data";
import type { WelcomeEmailProps } from "./WelcomeEmail";
import { WelcomeEmail } from "./WelcomeEmail";

function EmailPreview(props: WelcomeEmailProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		if (!iframeRef.current) return;

		const html = renderToStaticMarkup(<WelcomeEmail {...props} />);

		const iframeDoc = iframeRef.current?.contentDocument;
		if (iframeDoc) {
			iframeDoc.open();
			iframeDoc.write(html);
			iframeDoc.close();
		}
	}, [props]);

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
			description: "The username to display in the welcome message (optional)",
		},
		gettingStartedUrl: {
			control: "text",
			description: "URL for the Get Started button",
		},
		supportEmail: {
			control: "text",
			description: "Support email address",
		},
	},
} satisfies Meta<typeof EmailPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: welcomeEmailPreview,
};

export const WithoutUsername: Story = {
	args: {
		gettingStartedUrl: welcomeEmailPreview.gettingStartedUrl,
		supportEmail: welcomeEmailPreview.supportEmail,
	},
};

export const WithLongUsername: Story = {
	args: {
		...welcomeEmailPreview,
		username: "Alexandra Thompson-Williams",
	},
};
