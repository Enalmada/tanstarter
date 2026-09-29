import path from "node:path";
import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// Same Lingui setup as vite.config.ts: macros are expanded by Babel, catalogs
	// (.po) are compiled by the Lingui plugin.
	plugins: [babel({ presets: [linguiTransformerBabelPreset()] }), lingui()],
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
			"virtual:serwist": path.resolve(__dirname, "./src/utils/query/__tests__/mocks/virtual-serwist.ts"),
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["**/e2e/**", "**/*.stories.**"],
	},
});
