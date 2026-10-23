/**
 * Wiring guard: every server function must run behind authMiddleware or
 * freshAuthMiddleware unless it is deliberately public. The unit tests call the
 * exported handlers directly (and the test setup does not run middleware), so
 * without this a dropped `.middleware([...])` would go unnoticed.
 *
 * It scans all of `src` (not just `src/functions`) and compares the number of
 * `createServerFn(` calls with the number of `export const x = createServerFn(`
 * declarations it can check, so a function declared some other way fails too.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = path.resolve(__dirname, "../..");

// Callable without a session on purpose.
const PUBLIC_SERVER_FUNCTIONS = new Set([
	"getSessionUser", // session probe: null when anonymous
	"getRoleSelfService", // a boolean flag for the profile page
	"updateLocale", // sets the language cookie, also for signed-out visitors
]);

// POST functions that change no stored data, so they leave no `audit.mutation` line.
const NOT_AUDITED_SERVER_FUNCTIONS = new Set([
	"updateLocale", // language cookie
	"triggerSSENotification", // in-memory demo broadcast
	"throwUnexpectedServerError", // monitoring demos
	"throwExpectedServerError",
]);

const SKIPPED_DIRS = new Set(["__tests__", "e2e", "storybook", "node_modules"]);

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : sourceFiles(full);
		return /\.tsx?$/.test(entry.name) && !/\.(test|stories)\.tsx?$/.test(entry.name) ? [full] : [];
	});
}

// Comments must not count: a commented-out `.middleware([...])` is no middleware.
function stripComments(source: string) {
	return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
}

function scan() {
	const declared: { file: string; name: string; chain: string; handler: string }[] = [];
	let calls = 0;
	for (const file of sourceFiles(srcDir)) {
		const source = stripComments(readFileSync(file, "utf8"));
		calls += source.match(/\bcreateServerFn\(/g)?.length ?? 0;
		for (const match of source.matchAll(/export const (\w+) = createServerFn\(/g)) {
			const start = match.index ?? 0;
			const end = source.indexOf(".handler(", start);
			declared.push({
				file: path.relative(srcDir, file),
				name: match[1] ?? "",
				chain: source.slice(start, end),
				handler: source.slice(end, end + 40),
			});
		}
	}
	return { declared, calls };
}

describe("server function auth wiring", () => {
	const { declared, calls } = scan();

	it("finds the server functions", () => {
		expect(declared.length).toBeGreaterThan(8);
	});

	it("checks every createServerFn call (none declared in another form)", () => {
		expect(declared.length).toBe(calls);
	});

	it.each(declared.map((fn) => [fn.name, fn] as const))("%s is authenticated or explicitly public", (name, fn) => {
		const authed = /\.middleware\(\[\s*(?:authMiddleware|freshAuthMiddleware)\s*\]\)/.test(fn.chain);
		if (PUBLIC_SERVER_FUNCTIONS.has(name)) {
			expect(authed, `${name} is on the public allowlist but has auth middleware; drop it from the list`).toBe(false);
		} else {
			expect(authed, `${fn.file}: ${name} needs .middleware([authMiddleware | freshAuthMiddleware])`).toBe(true);
		}
	});

	it("declares a literal method on every server function", () => {
		for (const fn of declared) {
			expect(
				/createServerFn\(\{[^}]*\bmethod:\s*["'](?:GET|POST)["']/.test(fn.chain),
				`${fn.file}: ${fn.name} needs createServerFn({ method: "GET" | "POST" }) so the audit check can classify it`,
			).toBe(true);
		}
	});

	const posts = declared.filter((fn) => /\bmethod:\s*["']POST["']/.test(fn.chain));

	it("finds the POST server functions", () => {
		// An empty it.each registers no tests, so guard against the filter matching nothing.
		expect(posts.length).toBeGreaterThanOrEqual(8);
	});

	it.each(
		posts.map((fn) => [fn.name, fn] as const),
	)("%s writes an audit line or is listed as not storing data", (name, fn) => {
		const audited = /^\.handler\(\s*audited\(/.test(fn.handler);
		if (NOT_AUDITED_SERVER_FUNCTIONS.has(name)) {
			expect(audited, `${name} is audited; drop it from NOT_AUDITED_SERVER_FUNCTIONS`).toBe(false);
		} else {
			expect(audited, `${fn.file}: ${name} changes data, so wrap its handler: .handler(audited(...))`).toBe(true);
		}
	});
});
