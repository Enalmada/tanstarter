// This file has been automatically migrated to valid ESM format by Storybook.

import { createRequire } from "node:module";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig, type PluginOption } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

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

		// Storybook's builder loads the root vite.config.ts. Its app plugins
		// (TanStack Start, Nitro, the service worker build) replace the build
		// input with the app's hydration entry (src/client.tsx) and add ssr/nitro
		// environments, so `storybook build` bundled the real app instead of the
		// preview iframe. Stories only need React, Tailwind and Lingui from it.
		const plugins = await withoutAppPlugins(config.plugins);

		return mergeConfig(
			{ ...config, plugins },
			{
				resolve: {
					// Regex finds match the bare specifier only. A string find also
					// matches subpaths ("@tanstack/react-start/client" became
					// "MockReactStart.ts/client"), so each mocked subpath is listed.
					alias: [
						{ find: /^@tanstack\/react-start$/, replacement: mockReactStart },
						{ find: /^@tanstack\/react-start\/client$/, replacement: mockReactStart },
						{ find: /^@tanstack\/react-start\/client-rpc$/, replacement: mockReactStart },
						{ find: /^@tanstack\/react-start\/server$/, replacement: mockServerFunctions },
						{ find: /^@tanstack\/react-router$/, replacement: mockRouter },
						// `use-sync-external-store/shim*` aliases used to point at a hand-
						// rolled polyfill that returned a new closure per render and
						// triggered React's "Maximum update depth exceeded" guard during
						// hydration once @tanstack 1.167 landed. Polyfill deleted; let
						// Vite resolve the real package (v1.6.0, React-19 peerDep).
						{ find: "~", replacement: path.resolve(__dirname, "../src") },
						{ find: "../env.config", replacement: path.resolve(__dirname, "./env.mock.ts") },
					],
					dedupe: ["react", "react-dom"],
				},
				optimizeDeps: {
					exclude: ["@tanstack/react-router", "@tanstack/react-start"],
				},
				build: {
					sourcemap: true,
					minify: false,
				},
			},
		);
	},

	docs: {},
};

export default config;

// Plugins that build the full-stack app rather than the Storybook preview.
const APP_ONLY_PLUGIN = /^(tanstack|nitro|fullstack:|tanstarter:service-worker)/;

async function withoutAppPlugins(plugins: PluginOption[] = []): Promise<PluginOption[]> {
	const resolved = await Promise.all(
		plugins.map(async (option) => {
			const plugin = await option;
			return Array.isArray(plugin) ? withoutAppPlugins(plugin) : [plugin];
		}),
	);
	return resolved.flat().filter((plugin) => !(plugin && "name" in plugin && APP_ONLY_PLUGIN.test(plugin.name)));
}

function getAbsolutePath(value: string) {
	return dirname(require.resolve(join(value, "package.json")));
}
