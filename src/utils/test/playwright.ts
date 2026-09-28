import type { SessionUser } from "~/utils/auth-client";
import { PLAYWRIGHT_ADMIN_USER, PLAYWRIGHT_MEMBER_USER } from "./playwright-users";

/**
 * E2E sign-in shortcut: maps a Playwright test token in the `authorization`
 * header to the matching seeded user (see ./playwright-users.ts).
 *
 * The admin token is a passwordless admin login, so it only works on a dev
 * server that Playwright started: NODE_ENV=development AND PLAYWRIGHT=true
 * (set by the webServer command in playwright.config.ts). A plain `bun dev`
 * server ignores it. Returns null when there's no token, and the caller
 * falls through to the real session lookup.
 */
export const checkPlaywrightTestAuth = async (): Promise<SessionUser | null> => {
	if (process.env.NODE_ENV !== "development" || process.env.PLAYWRIGHT !== "true") {
		return null;
	}

	const { getSessionRequest } = await import("~/server/auth/request");
	const request = await getSessionRequest();
	if (!request) {
		return null;
	}

	const authHeader = request.headers.get("authorization");
	const seeded = [PLAYWRIGHT_MEMBER_USER, PLAYWRIGHT_ADMIN_USER].find((user) => user.token === authHeader);
	if (!seeded) {
		return null;
	}

	// Look the user up on every request so role changes made by a spec apply.
	const { eq } = await import("drizzle-orm");
	const db = (await import("~/server/db")).default;
	const { UserTable } = await import("~/server/db/schema");
	const [user] = await db.select().from(UserTable).where(eq(UserTable.email, seeded.email)).limit(1);
	if (!user) {
		const { logger } = await import("~/utils/logger");
		logger.error("Playwright test token used but its user isn't seeded; run `bun run drizzle:seed`", {
			email: seeded.email,
		});
		return null;
	}

	return {
		id: user.id,
		email: user.email,
		name: user.name ?? "",
		image: user.image,
		emailVerified: user.emailVerified,
		role: user.role,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	} as SessionUser;
};
