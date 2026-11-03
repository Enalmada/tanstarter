import { render } from "@react-email/render";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import type { AccountExistsEmailProps } from "./AccountExistsEmail";
import { AccountExistsEmail } from "./AccountExistsEmail";
import { accountExistsEmailPreview } from "./preview-data";

function EmailPreview(props: AccountExistsEmailProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [html, setHtml] = useState<string>("");

	useEffect(() => {
		let cancelled = false;

		render(<AccountExistsEmail {...props} />)
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
	title: "Emails/AccountExistsEmail",
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
		signInUrl: {
			control: "text",
			description: "Link the button points to (required)",
		},
		forgotPasswordUrl: {
			control: "text",
			description: "Link to the password-reset request page (required)",
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
	args: accountExistsEmailPreview,
};

export const WithoutSupportEmail: Story = {
	args: {
		...accountExistsEmailPreview,
		supportEmail: "",
	},
};

export const CustomBranding: Story = {
	args: {
		...accountExistsEmailPreview,
		appName: "Acme",
	},
};
