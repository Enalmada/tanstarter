import type { Preview } from "@storybook/react-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMockQueryClient } from "../src/storybook/mockQueries";
import "../src/styles/app.css";
import "./main.css";

// Create a mock query client for Storybook
const queryClient = createMockQueryClient();

const preview: Preview = {
	parameters: {
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
				transform: (code: string) => code.replace(/\/sb-addons\//g, "/sb-addons/"),
			},
		},
		server: {
			url: typeof window !== "undefined" ? window.location.origin : "http://localhost:6006",
		},
	},

	decorators: [
		(Story) => (
			<QueryClientProvider client={queryClient}>
				<div className="min-h-screen p-4 antialiased">
					<Story />
				</div>
			</QueryClientProvider>
		),
	],

	tags: ["autodocs"],
};

export default preview;
