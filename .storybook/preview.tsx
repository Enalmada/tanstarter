import type { Preview } from "@storybook/react";
import "../app/styles/app.css";
import "./main.css";

const preview: Preview = {
	parameters: {
		actions: { argTypesRegex: "^on[A-Z].*" },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
		layout: "centered",
		themes: {
			default: "light",
			list: [
				{ name: "light", class: "", color: "#ffffff" },
				{ name: "dark", class: "dark", color: "#000000" },
			],
		},
		// Cloudflare Pages specific configurations
		docs: {
			source: {
				transform: (code: string) =>
					code.replace(/\/sb-addons\//g, "/sb-addons/"),
			},
		},
		server: {
			url:
				typeof window !== "undefined"
					? window.location.origin
					: "http://localhost:6006",
		},
	},
	decorators: [
		(Story) => (
			<div className="min-h-screen p-4 antialiased">
				<Story />
			</div>
		),
	],
};

export default preview;
