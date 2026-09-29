import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Guards WCAG 2.1 AA contrast for the destructive palette (ported from UseFrank/frank#43).
 *
 * `--destructive` is the brand red used for borders, rings and tinted fills. It is too
 * light to carry text in light mode. `--destructive-strong` is the ink behind
 * `text-destructive-strong`, used for error copy and destructive labels. The assertions
 * read the real token values from `app.css`, so a token edit that breaks contrast fails here.
 */

const AA_NORMAL_TEXT = 4.5;
/** WCAG 2.1 SC 1.4.11: user-interface components and graphical objects. */
const AA_NON_TEXT = 3;

const here = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.resolve(here, "../app.css"), "utf8");

type Rgb = readonly [number, number, number];

/** Pull a `--name: H S% L%;` token out of the `:root` or `.dark` block. */
function readToken(name: string, scope: "root" | "dark"): Rgb {
	const blockStart = css.indexOf(scope === "root" ? ":root {" : ".dark {");
	expect(blockStart, `${scope} block not found in app.css`).toBeGreaterThan(-1);

	// Fail loudly if app.css is reformatted: an indexOf of -1 would make slice() read to
	// the end of the file and silently match a token from a later block.
	const blockEnd = css.indexOf("\n  }", blockStart);
	expect(blockEnd, `${scope} block end not found in app.css; was it reformatted?`).toBeGreaterThan(blockStart);
	const block = css.slice(blockStart, blockEnd);

	const match = new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%\\s*;`).exec(block);
	expect(match, `--${name} not found in ${scope} block`).not.toBeNull();

	const [, h, s, l] = match as RegExpExecArray;
	return hslToRgb(Number(h), Number(s), Number(l));
}

function hslToRgb(h: number, s: number, l: number): Rgb {
	const sat = s / 100;
	const light = l / 100;
	const c = (1 - Math.abs(2 * light - 1)) * sat;
	const hp = h / 60;
	const x = c * (1 - Math.abs((hp % 2) - 1));

	let rgb: [number, number, number];
	if (hp < 1) rgb = [c, x, 0];
	else if (hp < 2) rgb = [x, c, 0];
	else if (hp < 3) rgb = [0, c, x];
	else if (hp < 4) rgb = [0, x, c];
	else if (hp < 5) rgb = [x, 0, c];
	else rgb = [c, 0, x];

	const m = light - c / 2;
	return rgb.map((v) => Math.round((v + m) * 255)) as unknown as Rgb;
}

/** WCAG 2.1 relative luminance. */
function luminance([r, g, b]: Rgb): number {
	const channel = (v: number) => {
		const n = v / 255;
		return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
	const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
	return (lighter + 0.05) / (darker + 0.05);
}

/** Composite a translucent foreground over an opaque background (e.g. `bg-destructive/10`). */
function over(fg: Rgb, bg: Rgb, alpha: number): Rgb {
	return fg.map((v, i) => Math.round(v * alpha + (bg[i] ?? 0) * (1 - alpha))) as unknown as Rgb;
}

describe("destructive token contrast (WCAG AA)", () => {
	describe("light theme", () => {
		const background = readToken("background", "root");
		const card = readToken("card", "root");
		const accent = readToken("accent", "root");
		const muted = readToken("muted", "root");
		const destructive = readToken("destructive", "root");
		const strong = readToken("destructive-strong", "root");

		it("keeps error text readable on --background and --card", () => {
			expect(contrastRatio(strong, background)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
			expect(contrastRatio(strong, card)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
		});

		it("keeps error text readable on destructive tint panels up to /15, on any surface", () => {
			for (const surface of [background, card, accent, muted]) {
				for (const alpha of [0.1, 0.15]) {
					expect(contrastRatio(strong, over(destructive, surface, alpha))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
				}
			}
		});

		it("keeps the invalid-field border above the 1.4.11 non-text floor", () => {
			for (const surface of [background, card]) {
				expect(contrastRatio(destructive, surface)).toBeGreaterThanOrEqual(AA_NON_TEXT);
			}
		});

		it("keeps the alert description readable at text-destructive-strong/90", () => {
			expect(contrastRatio(over(strong, card, 0.9), card)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
		});

		it("documents why --destructive itself must not carry text", () => {
			expect(contrastRatio(destructive, background)).toBeLessThan(AA_NORMAL_TEXT);
		});
	});

	describe("dark theme", () => {
		const background = readToken("background", "dark");
		const destructive = readToken("destructive", "dark");
		const strong = readToken("destructive-strong", "dark");

		it("keeps error text readable on --background", () => {
			expect(contrastRatio(strong, background)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
		});

		it("keeps the invalid-field border above the 1.4.11 non-text floor", () => {
			expect(contrastRatio(destructive, background)).toBeGreaterThanOrEqual(AA_NON_TEXT);
		});

		it("keeps error text readable on destructive tint panels up to /30", () => {
			// dark:bg-destructive/20 (badge) and dark:hover:bg-destructive/30 (button)
			for (const alpha of [0.1, 0.2, 0.3]) {
				expect(contrastRatio(strong, over(destructive, background, alpha))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
			}
		});
	});

	it("has no --destructive-foreground token", () => {
		// The token promised a readable label on a solid bg-destructive, which light mode
		// cannot deliver. If a shadcn re-pull reintroduces the pairing, fail here rather than
		// let the class silently resolve to nothing.
		expect(css).not.toMatch(/--(?:color-)?destructive-foreground\s*:/);
	});

	it("does not soften the invalid-field border with an opacity modifier", () => {
		const offenders = findMatches(path.resolve(here, "../.."), /aria-invalid:border-destructive\/\d+/);
		expect(offenders, `half-opacity invalid border fails 3:1: ${offenders.join(", ")}`).toEqual([]);
	});

	it("keeps the solid invalid-field border on the form controls", () => {
		// A shadcn re-pull can drop the class entirely; the ban above would then pass vacuously.
		for (const file of ["input", "textarea", "select", "checkbox", "radio-group"]) {
			const source = readFileSync(path.resolve(here, `../../components/ui/${file}.tsx`), "utf8");
			expect(source, `${file}.tsx lost aria-invalid:border-destructive`).toMatch(
				/aria-invalid:border-destructive(?![/-])/,
			);
		}
	});

	it("does not use --destructive as text ink in components", () => {
		const offenders = findMatches(path.resolve(here, "../.."), /text-destructive(?!-strong)|text-red-[45]00/);
		expect(
			offenders,
			`low-contrast destructive ink found; use text-destructive-strong:\n$offenders.join("\n")`,
		).toEqual([]);
	});
});

/** `file:line` of every non-test, non-story source line matching `banned`. */
function findMatches(dir: string, banned: RegExp, root: string = dir): string[] {
	const hits: string[] = [];

	for (const entry of readdirSync(dir)) {
		if (entry === "node_modules" || entry === "e2e") continue;
		const full = path.join(dir, entry);
		if (statSync(full).isDirectory()) {
			hits.push(...findMatches(full, banned, root));
			continue;
		}
		if (!/\.(tsx|ts)$/.test(entry) || /\.(test|stories)\.(tsx|ts)$/.test(entry)) continue;

		for (const [index, line] of readFileSync(full, "utf8").split("\n").entries()) {
			if (banned.test(line)) {
				hits.push(`${path.relative(root, full).split(path.sep).join("/")}:${index + 1}`);
			}
		}
	}
	return hits;
}
