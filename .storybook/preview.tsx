import { setupI18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import type { Preview } from "@storybook/react-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import { dynamicActivate, isLocale, LOCALES } from "../src/lib/i18n/locales";
import { createMockQueryClient } from "../src/storybook/mockQueries";
import "../src/styles/app.css";
import "./main.css";

// Create a mock query client for Storybook
const queryClient = createMockQueryClient();

// One instance for the preview iframe (one story renders at a time). The app
// itself creates one per request; see src/lib/i18n.
const i18n = setupI18n();

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

	// Toolbar language switch; a story can also set `globals: { locale: "es" }`.
	globalTypes: {
		locale: {
			description: "Language",
			toolbar: {
				icon: "globe",
				dynamicTitle: true,
				items: Object.entries(LOCALES).map(([value, title]) => ({ value, title })),
			},
		},
	},
	initialGlobals: { locale: "en" },

	// Loads the catalog for the selected locale before the story renders
	loaders: [
		async ({ globals }) => {
			await dynamicActivate(i18n, isLocale(globals.locale) ? globals.locale : "en");
		},
	],

	decorators: [
		(Story) => (
			<I18nProvider i18n={i18n}>
				<QueryClientProvider client={queryClient}>
					<div className="min-h-screen p-4 antialiased">
						<Story />
					</div>
				</QueryClientProvider>
			</I18nProvider>
		),
	],

	tags: ["autodocs"],
};

export default preview;
