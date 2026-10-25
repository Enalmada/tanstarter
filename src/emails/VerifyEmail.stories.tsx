import { render } from "@react-email/render";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import { verifyEmailPreview } from "./preview-data";
import type { VerifyEmailProps } from "./VerifyEmail";
import { VerifyEmail } from "./VerifyEmail";

function EmailPreview(props: VerifyEmailProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [html, setHtml] = useState<string>("");

	useEffect(() => {
		let cancelled = false;

		render(<VerifyEmail {...props} />)
			.then((result) => {
				if (!cancelled) {
					setHtml(result);
				}
			})
			.catch((error: unknown) => {
				if (!cancelled) {
					setHtml(`<pre>Failed to render email: ${String(error)}</pre>`);
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
	title: "Emails/VerifyEmail",
	component: EmailPreview,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		backgrounds: {
			default: "light",
		},
	},
	argTypes: {
		appName: {
			control: "text",
			description: "App/brand name shown in header and footer (required)",
		},
		verificationUrl: {
			control: "text",
			description: "Link the button points to (required)",
		},
		linkValidMinutes: {
			control: "number",
			description: "How long the link works, in minutes (required)",
		},
		supportEmail: {
			control: "text",
			description: "Optional support address; the footer's contact line is omitted when empty",
		},
	},
} satisfies Meta<typeof EmailPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: verifyEmailPreview,
};

export const WithoutSupportEmail: Story = {
	args: {
		...verifyEmailPreview,
		supportEmail: "",
	},
};

export const CustomBranding: Story = {
	args: {
		...verifyEmailPreview,
		appName: "Acme",
	},
};
