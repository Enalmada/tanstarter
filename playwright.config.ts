import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightTestConfig } from "@playwright/test";

// Set NODE_ENV for tests - required for test tokens to work in auth.ts
process.env.NODE_ENV = "development";
/**
 * Playwright Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Key testing principles:
 * 1. Tests run in parallel - each test should be independent
 * 2. No shared state between tests - create/cleanup test data within each test
 * 3. Fast timeouts - we use SSR so pages should load quickly
 * 4. Simple auth setup - separate member and admin test suites
 *
 * Test organization:
 * - auth/ - Authentication setup for member and admin roles
 * - member/ - Member-specific tests (requires member auth)
 * - admin/ - Admin-specific tests (requires admin auth)
 * - public/ - Public page tests (no auth required)
 */
const config: PlaywrightTestConfig = {
	testDir: "./app/e2e",
	// Enable parallel execution for faster test runs
	// Tests must be independent since they run in parallel
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : "100%",

	// Shared settings for all projects
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	// Built-in development server management
	webServer: {
		command: "bun run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		stdout: "pipe",
		stderr: "pipe",
		timeout: 120000, // 2 minutes
		env: {
			NODE_ENV: "development",
		},
	},

	reporter: [
		["list"],
		["json", { outputFile: "playwright/results/test-results.json" }],
		[
			"html",
			{
				open: "never",
				outputFolder: "playwright/report",
				showReuseMessage: true,
				host: "127.0.0.1",
				port: 9323,
			},
		],
		process.env.CI ? ["github"] : ["dot"],
	],

	projects: [
		// Auth setup projects run first to establish authenticated states
		{
			name: "setup-member",
			testMatch: "**/auth/member.setup.ts",
		},
		{
			name: "setup-admin",
			testMatch: "**/auth/admin.setup.ts",
		},

		// Member test suite - uses member.json auth state
		{
			name: "member",
			testDir: "./app/e2e/member",
			use: {
				...devices["Desktop Chrome"],
				storageState: "playwright/.auth/member.json",
			},
			dependencies: ["setup-member"],
		},

		// Admin test suite - uses admin.json auth state
		{
			name: "admin",
			testDir: "./app/e2e/admin",
			use: {
				...devices["Desktop Chrome"],
				storageState: "playwright/.auth/admin.json",
			},
			dependencies: ["setup-admin"],
		},

		// Public pages - no auth required
		{
			name: "public",
			testDir: "./app/e2e/public",
			use: { ...devices["Desktop Chrome"] },
		},
	],
};

export default defineConfig(config);
