import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
	stories: ["../app/**/*.mdx", "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-interactions",
		"@storybook/addon-a11y",
		"@storybook/addon-coverage",
		"@storybook/addon-themes",
	],
	framework: "@storybook/react-vite",
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
	viteFinal: async (config) => {
		return {
			...config,
			define: {
				...config.define,
				"process.env": {},
			},
		};
	},
};

export default config;
