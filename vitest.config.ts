import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./app"),
			"virtual:serwist": path.resolve(__dirname, "./app/test/mocks/serwist.ts"),
		},
	},
	test: {
		environment: "happy-dom",
		environmentMatchGlobs: [
			["app/__tests__/routes/**/*.{test,spec}.{ts,tsx}", "happy-dom"],
			["app/components/**/*.{test,spec}.{ts,tsx}", "happy-dom"],
			["app/server/**/*.{test,spec}.{ts,tsx}", "node"],
			["app/lib/**/*.{test,spec}.{ts,tsx}", "node"],
			["app/utils/**/*.{test,spec}.{ts,tsx}", "node"],
		],
		setupFiles: ["app/test/setup.ts"],
		globals: true,
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/.{idea,git,cache,output,temp}/**",
		],
		isolate: false,
		pool: "forks",
	},
});
