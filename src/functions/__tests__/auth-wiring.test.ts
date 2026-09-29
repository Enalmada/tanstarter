/**
 * Wiring guard: every server function must run behind authMiddleware or
 * freshAuthMiddleware unless it is deliberately public. The unit tests call the
 * exported handlers directly (and the test setup does not run middleware), so
 * without this a dropped `.middleware([...])` would go unnoticed.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const functionsDir = path.resolve(__dirname, "..");

// Callable without a session on purpose.
const PUBLIC_SERVER_FUNCTIONS = new Set([
	"getSessionUser", // session probe: null when anonymous
	"getRoleSelfService", // a boolean flag for the profile page
	"updateLocale", // sets the language cookie, also for signed-out visitors
]);

function serverFunctions() {
	const found: { file: string; name: string; chain: string }[] = [];
	for (const file of readdirSync(functionsDir).filter((f) => /\.tsx?$/.test(f))) {
		const source = readFileSync(path.join(functionsDir, file), "utf8");
		for (const match of source.matchAll(/export const (\w+) = createServerFn\(/g)) {
			const start = match.index ?? 0;
			const end = source.indexOf(".handler(", start);
			found.push({ file, name: match[1] ?? "", chain: source.slice(start, end) });
		}
	}
	return found;
}

describe("server function auth wiring", () => {
	const functions = serverFunctions();

	it("finds the server functions", () => {
		expect(functions.length).toBeGreaterThan(8);
	});

	it.each(functions.map((fn) => [fn.name, fn] as const))("%s is authenticated or explicitly public", (name, fn) => {
		const authed = /\.middleware\(\[\s*(?:authMiddleware|freshAuthMiddleware)\s*\]\)/.test(fn.chain);
		if (PUBLIC_SERVER_FUNCTIONS.has(name)) {
			expect(authed, `${name} is on the public allowlist but has auth middleware; drop it from the list`).toBe(false);
		} else {
			expect(authed, `${fn.file}: ${name} needs .middleware([authMiddleware | freshAuthMiddleware])`).toBe(true);
		}
	});
});
