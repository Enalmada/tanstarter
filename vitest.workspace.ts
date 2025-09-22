import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	{
		extends: "./vitest.unit.config.ts",
		test: {
			name: "unit",
			include: ["src/**/*.{test,spec}.{ts,tsx}"],
			exclude: ["**/*.stories.**", "**/e2e/**"],
		},
	},
]);
