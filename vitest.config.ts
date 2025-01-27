import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./app"),
			"~": path.resolve(__dirname, "./app"),
			"virtual:serwist": path.resolve(
				__dirname,
				"./app/utils/query/__tests__/mocks/virtual-serwist.ts",
			),
		},
	},
	test: {
		globals: true,
		environment: "node",
		environmentMatchGlobs: [["**/components/**/*.test.{ts,tsx}", "happy-dom"]],
		setupFiles: ["./app/test/setup.ts"],
		include: ["app/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["**/e2e/**"],
	},
});
