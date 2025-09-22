import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
			"virtual:serwist": path.resolve(
				__dirname,
				"./src/utils/query/__tests__/mocks/virtual-serwist.ts",
			),
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
