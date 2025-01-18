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
		environment: "happy-dom",
		setupFiles: ["./app/test/setup.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/e2e/**",
			"**/.{idea,git,cache,output,temp}/**",
		],
	},
});
