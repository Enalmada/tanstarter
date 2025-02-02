import path from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
	stories: ["../app/components/ui/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: ["@storybook/addon-essentials"],
	framework: {
		name: "@storybook/react-vite",
		options: {
			strictMode: true,
		},
	},
	core: {
		disableTelemetry: true,
	},
	async viteFinal(config) {
		return mergeConfig(config, {
			resolve: {
				alias: {
					"~": path.resolve(__dirname, "../app"),
				},
			},
		});
	},
};

export default config;
