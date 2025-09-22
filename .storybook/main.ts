import path, { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
	stories: [
		"../app/components/ui/**/*.stories.@(js|jsx|ts|tsx)",
		"../src/**/*.stories.@(js|jsx|ts|tsx)",
	],
	addons: [getAbsolutePath("@storybook/addon-docs")],

	framework: {
		name: getAbsolutePath("@storybook/react-vite"),
		options: {
			strictMode: true,
		},
	},

	core: {
		disableTelemetry: true,
	},

	staticDirs: ["./static"],

	async viteFinal(config) {
		return mergeConfig(config, {
			resolve: {
				alias: {
					"~": path.resolve(__dirname, "../src"),
				},
			},
			build: {
				sourcemap: true,
				minify: false,
			},
		});
	},

	docs: {},
};

export default config;

function getAbsolutePath(value: string) {
	return dirname(require.resolve(join(value, "package.json")));
}
