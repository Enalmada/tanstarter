import type { PlaywrightTestConfig } from "@playwright/test";
import { defineConfig, devices } from "@playwright/test";
import { PLAYWRIGHT_ADMIN_USER, PLAYWRIGHT_MEMBER_USER } from "./src/utils/test/playwright-users";

// Test-token sign-in (src/utils/test/playwright.ts) needs NODE_ENV=development
// and PLAYWRIGHT=true on the dev server; the webServer command sets both.
process.env.NODE_ENV = "development";
// Exact match: CI=false (or any other string) must not turn on CI settings
const isCI = process.env.CI === "true";
/**
 * Playwright Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Key testing principles:
 * 1. Tests run in parallel - each test should be independent
 * 2. No shared state between tests - create/cleanup test data within each test
 * 3. Fast timeouts - we use SSR so pages should load quickly
 * 4. Seeded users - member/admin projects sign in as the users seeded by
 *    `bun run drizzle:seed`, via a test token header (see playwright-users.ts)
 *
 * Test organization:
 * - auth/ - Checks each project's test token resolves to its seeded user
 * - member/ - Member-specific tests (requires member auth)
 * - admin/ - Admin-specific tests (requires admin auth)
 * - public/ - Public page tests (no auth required)
 */
const config: PlaywrightTestConfig = {
	testDir: "./src/e2e",
	// Enable parallel execution for faster test runs
	// Tests must be independent since they run in parallel
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	// CI: 50% to space out cold-start hits against `vite dev`. With 100%
	// (one worker per logical core) multiple tests race the dep-optimization
	// reload window the dev server hits on first request after a dep bump
	// — every test in that 10-15s window flakes. 50% halves the race surface
	// and aligns with gell-v2's ENG-220 lesson. Tracked as a follow-up to
	// migrate CI to the production Nitro bundle (matches gell-v2 ENG-220),
	// which would let us safely return to 100%.
	workers: isCI ? "50%" : "80%",
	// Cold `vite dev` first-paint can land in the 10-15s range after a major
	// dep bump (better-auth + tanstack family). 30s default left no headroom.
	timeout: 60_000,

	// Shared settings for all projects
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	// Built-in development server management.
	//
	// `url` (not `port`) gates readiness on a real 200 from `/`, which forces
	// vite to complete its first SSR render — including the initial dep-
	// discovery pass — before any test fires. The earlier `port: 3000` shape
	// only checked that the TCP socket was open, which vite does ~12s BEFORE
	// it finishes pre-bundling the better-auth + tanstack dep tree. Tests
	// in that window all flaked.
	webServer: {
		reuseExistingServer: true,
		command:
			"bun run docker:up && sh scripts/wait-for.sh && bun run drizzle:migrate && bun run drizzle:seed && cross-env GOOGLE_CLIENT_ID=test-client-id GOOGLE_CLIENT_SECRET=test-client-secret BETTER_AUTH_SECRET=test-auth-secret APP_ENV=development PLAYWRIGHT=true bun run dev:vite",
		url: "http://localhost:3000",
		stdout: "pipe",
		stderr: "pipe",
		// Stop the dev server cleanly after the run instead of leaving it orphaned
		// (notably on Windows).
		gracefulShutdown: { signal: "SIGTERM", timeout: 500 },
		timeout: 120000, // 2 minutes
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
		isCI ? ["github"] : ["dot"],
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

		// Test-token auth is a header, and storageState doesn't persist headers,
		// so each project sends its own token.
		{
			name: "member",
			testDir: "./src/e2e/member",
			use: {
				...devices["Desktop Chrome"],
				storageState: "playwright/.auth/member.json",
				extraHTTPHeaders: { authorization: PLAYWRIGHT_MEMBER_USER.token },
			},
			dependencies: ["setup-member"],
		},

		{
			name: "admin",
			testDir: "./src/e2e/admin",
			use: {
				...devices["Desktop Chrome"],
				storageState: "playwright/.auth/admin.json",
				extraHTTPHeaders: { authorization: PLAYWRIGHT_ADMIN_USER.token },
			},
			dependencies: ["setup-admin"],
		},

		// Public pages - no auth required
		{
			name: "public",
			testDir: "./src/e2e/public",
			use: { ...devices["Desktop Chrome"] },
		},
	],
};

export default defineConfig(config);
