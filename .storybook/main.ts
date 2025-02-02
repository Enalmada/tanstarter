import path from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
	stories: [
		"../app/**/*.mdx",
		"../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../app/components/ui/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-interactions",
		"@storybook/addon-a11y",
		"@storybook/addon-coverage",
		"@storybook/addon-themes",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	core: {
		builder: "@storybook/builder-vite",
		disableTelemetry: true,
	},
	docs: {
		autodocs: "tag",
		defaultName: "Documentation",
	},
	typescript: {
		reactDocgen: "react-docgen",
		check: false,
	},
	async viteFinal(config) {
		return mergeConfig(config, {
			define: {
				"process.env": {},
			},
			resolve: {
				alias: {
					"~": path.resolve(__dirname, "../app"),
				},
			},
			optimizeDeps: {
				include: [
					"@storybook/addon-interactions/preview",
					"react/jsx-dev-runtime",
				],
			},
		});
	},
};

export default config;
