import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		projects: [
			// Unit tests project
			{
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
					name: "unit",
					globals: true,
					environment: "happy-dom",
					setupFiles: ["./src/test/setup.ts"],
					include: ["src/**/*.{test,spec}.{ts,tsx}"],
					exclude: ["**/e2e/**", "**/*.stories.**"],
				},
			},
			// Storybook tests project
			{
				plugins: [
					storybookTest({ configDir: path.join(__dirname, ".storybook") }),
				],
				resolve: {
					alias: {
						"~/functions/session": path.resolve(
							__dirname,
							"./src/storybook/MockServerFunctions.ts",
						),
						"~/functions/base-service": path.resolve(
							__dirname,
							"./src/storybook/MockServerFunctions.ts",
						),
						"~": path.resolve(__dirname, "./src"),
						"@tanstack/react-router": path.resolve(
							__dirname,
							"./src/storybook/MockLink.tsx",
						),
						"@tanstack/react-start": path.resolve(
							__dirname,
							"./src/storybook/MockReactStart.ts",
						),
						"@tanstack/react-start/server": path.resolve(
							__dirname,
							"./src/storybook/MockSSRServer.ts",
						),
						"@tanstack/react-start-server": path.resolve(
							__dirname,
							"./src/storybook/MockSSRServer.ts",
						),
						"@tanstack/react-start-client": path.resolve(
							__dirname,
							"./src/storybook/MockReactStart.ts",
						),
						"tanstack-start-route-tree:v": path.resolve(
							__dirname,
							"./src/utils/query/__tests__/mocks/tanstack-start-route-tree.ts",
						),
						"tanstack-start-manifest:v": path.resolve(
							__dirname,
							"./src/utils/query/__tests__/mocks/tanstack-start-manifest.ts",
						),
						"tanstack-start-server-fn-manifest:v": path.resolve(
							__dirname,
							"./src/utils/query/__tests__/mocks/tanstack-start-server-fn-manifest.ts",
						),
					},
				},
				define: {
					"process.env.NODE_ENV": '"test"',
				},
				optimizeDeps: {
					include: [
						"@storybook/react",
						"react/jsx-dev-runtime",
						"@tanstack/react-query",
						"react",
						"lucide-react",
						"clsx",
						"tailwind-merge",
						"@radix-ui/react-slot",
						"class-variance-authority",
					],
					exclude: [
						"@tanstack/react-start",
						"@tanstack/react-start-server",
						"@tanstack/react-start-client",
					],
				},
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						instances: [{ browser: "chromium" }],
						provider: "playwright",
					},
					setupFiles: ["./.storybook/vitest.setup.ts"],
				},
			},
		],
	},
});
