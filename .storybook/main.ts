import path, { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
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
		const mockReactStart = path.resolve(__dirname, "../src/storybook/MockReactStart.ts");
		const mockServerFunctions = path.resolve(__dirname, "../src/storybook/MockServerFunctions.ts");
		const mockRouter = path.resolve(__dirname, "../src/storybook/MockLink.tsx");
		const useSyncShim = path.resolve(__dirname, "../src/polyfills/use-sync-external-store-shim.ts");

		return mergeConfig(config, {
			resolve: {
				alias: [
					{ find: "@tanstack/react-start/client-rpc", replacement: mockReactStart },
					{ find: "@tanstack/react-start/server", replacement: mockServerFunctions },
					{ find: "@tanstack/react-start", replacement: mockReactStart },
					{ find: "@tanstack/react-router", replacement: mockRouter },
					{ find: "use-sync-external-store/shim/with-selector.js", replacement: useSyncShim },
					{ find: "use-sync-external-store/shim/with-selector", replacement: useSyncShim },
					{ find: "use-sync-external-store/shim/index.js", replacement: useSyncShim },
					{ find: "use-sync-external-store/shim", replacement: useSyncShim },
					{ find: "~", replacement: path.resolve(__dirname, "../src") },
					{ find: "../env.config", replacement: path.resolve(__dirname, "./env.mock.ts") },
				],
			},
			optimizeDeps: {
				exclude: ["@tanstack/react-router", "@tanstack/react-start"],
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
