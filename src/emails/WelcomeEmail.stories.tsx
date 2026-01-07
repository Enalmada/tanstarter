import { render } from "@react-email/render";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import { welcomeEmailPreview } from "./preview-data";
import type { WelcomeEmailProps } from "./WelcomeEmail";
import { WelcomeEmail } from "./WelcomeEmail";

function EmailPreview(props: WelcomeEmailProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [html, setHtml] = useState<string>("");

	useEffect(() => {
		let cancelled = false;

		render(<WelcomeEmail {...props} />).then((result) => {
			if (!cancelled) {
				setHtml(result);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [props]);

	useEffect(() => {
		if (!iframeRef.current || !html) return;

		const iframeDoc = iframeRef.current.contentDocument;
		if (iframeDoc) {
			iframeDoc.open();
			iframeDoc.write(html);
			iframeDoc.close();
		}
	}, [html]);

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
		appName: {
			control: "text",
			description: "App/brand name shown in header and footer (required)",
		},
		gettingStartedUrl: {
			control: "text",
			description: "URL for the Get Started button (required)",
		},
		supportEmail: {
			control: "text",
			description: "Support email address (required)",
		},
		unsubscribeUrl: {
			control: "text",
			description: "Unsubscribe URL for email compliance (optional)",
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
		appName: welcomeEmailPreview.appName,
		gettingStartedUrl: welcomeEmailPreview.gettingStartedUrl,
		supportEmail: welcomeEmailPreview.supportEmail,
		unsubscribeUrl: welcomeEmailPreview.unsubscribeUrl,
	},
};

export const WithLongUsername: Story = {
	args: {
		...welcomeEmailPreview,
		username: "Alexandra Thompson-Williams",
	},
};

export const WithoutUnsubscribe: Story = {
	args: {
		appName: welcomeEmailPreview.appName,
		gettingStartedUrl: welcomeEmailPreview.gettingStartedUrl,
		supportEmail: welcomeEmailPreview.supportEmail,
	},
};

export const CustomBranding: Story = {
	args: {
		...welcomeEmailPreview,
		appName: "FrontlineIQ",
	},
};
