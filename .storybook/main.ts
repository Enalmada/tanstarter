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
		// Temporarily commenting out other addons to test
		// "@storybook/addon-interactions",
		// "@storybook/addon-a11y",
		// "@storybook/addon-themes",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {
			strictMode: true,
		},
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
				"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
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
				sourcemap: true,
			},
			server: {
				fs: {
					strict: false,
				},
				hmr: {
					overlay: false,
				},
			},
		});
	},
};

export default config;
