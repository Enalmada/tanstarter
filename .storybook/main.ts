import path from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
	stories: [
		{
			directory: "../app",
			files: "**/*.mdx",
		},
		{
			directory: "../app",
			files: "**/*.stories.@(js|jsx|mjs|ts|tsx)",
		},
	],
	addons: [
		"@storybook/addon-essentials",
		"@storybook/addon-interactions",
		"@storybook/addon-a11y",
		"@storybook/addon-themes",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	core: {
		builder: "@storybook/builder-vite",
		disableTelemetry: true,
		enableCrashReports: false,
	},
	docs: {
		autodocs: "tag",
		defaultName: "Documentation",
	},
	typescript: {
		reactDocgen: "react-docgen",
		check: false,
	},
	staticDirs: ["./static"],
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
			build: {
				modulePreload: false,
				rollupOptions: {
					output: {
						manualChunks: undefined,
					},
				},
			},
		});
	},
};

export default config;
