/**
 * Users the e2e suite signs in as. Seeded by `bun run drizzle:seed`
 * (src/server/db/seed.ts) and resolved by the dev-only test-token lookup in
 * `./playwright.ts`.
 *
 * They're separate from any account you use by hand because the dev server
 * and the e2e run share one database, and specs create and delete these
 * users' data. Neither has a password: they sign in only through the test
 * token header, which works only on a dev server started with PLAYWRIGHT=true.
 */
export const PLAYWRIGHT_MEMBER_USER = {
	email: "member@playwright.local",
	name: "Playwright Member",
	token: "playwright-test-token",
} as const;

export const PLAYWRIGHT_ADMIN_USER = {
	email: "admin@playwright.local",
	name: "Playwright Admin",
	token: "playwright-admin-test-token",
} as const;
