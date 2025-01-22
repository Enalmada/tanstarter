import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./app"),
			"virtual:serwist": path.resolve(
				__dirname,
				"./app/utils/query/__tests__/mocks/virtual-serwist.ts",
			),
		},
	},
	test: {
		globals: true,
		environment: "node", // Default to node for maximum speed
		environmentMatchGlobs: [
			// Use happy-dom only for components and routes that need DOM
			["**/components/**/*.test.{ts,tsx}", "happy-dom"],
		],
		setupFiles: ["./app/test/setup.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/e2e/**",
			"**/.{idea,git,cache,output,temp}/**",
		],
	},
});
