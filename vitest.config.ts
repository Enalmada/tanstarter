import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./app"),
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
