import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightTestConfig } from "@playwright/test";

/**
 * Playwright Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Key decisions:
 * - Single browser (Chrome) for faster development
 * - Headless mode enabled but visible in VSCode for debugging
 * - Multiple reporters for different use cases (CI, local, debugging)
 * - Artifacts stored in organized directories under /playwright
 */
const config: PlaywrightTestConfig = {
	// Test files location and patterns
	testDir: "./app/e2e",

	// Test execution settings
	fullyParallel: true, // Run tests in parallel for speed
	forbidOnly: !!process.env.CI, // Fail if test.only is left in the code
	retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
	workers: process.env.CI ? 1 : "50%", // Parallel workers (single in CI for stability)

	// Reporting configuration
	reporter: [
		["list"], // Basic terminal output
		[
			"json",
			{
				outputFile: "playwright/results/test-results.json", // For programmatic analysis
			},
		],
		[
			"html",
			{
				open: "never", // Don't auto-open report
				outputFolder: "playwright/report",
				showReuseMessage: true,
				host: "127.0.0.1",
				port: 9323,
				browserCommand: "bunx playwright show-report playwright/report",
			},
		],
		process.env.CI ? ["github"] : ["dot"], // GitHub annotations in CI
	],

	// Test artifacts location (screenshots, videos, etc.)
	outputDir: "playwright/artifacts",

	// Browser and test execution context
	use: {
		// Using existing dev server at localhost:3000
		baseURL: "http://localhost:3000",

		// Tracing and debugging
		trace: "on-first-retry", // Capture traces only on retry
		screenshot: "only-on-failure", // Save screenshots only on failure
		video: "retain-on-failure", // Save videos only on failure
		headless: true, // Run headless but VSCode settings may override
	},

	// Browser projects
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		// Additional browsers can be enabled when needed:
		// - Firefox for different rendering engine
		// - WebKit for Safari compatibility
		// - Mobile browsers for responsive testing
	],
};

export default defineConfig(config);
