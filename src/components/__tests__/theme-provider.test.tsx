import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getThemeScript, ThemeProvider, useTheme } from "~/components/theme-provider";

vi.mock("@tanstack/react-router", () => ({
	// The real ScriptOnce renders an inline <script> on the server only
	ScriptOnce: () => null,
}));

type MediaListener = () => void;

let prefersDark = false;
let mediaListeners: MediaListener[] = [];

function stubMatchMedia() {
	vi.stubGlobal(
		"matchMedia",
		vi.fn().mockImplementation(() => ({
			get matches() {
				return prefersDark;
			},
			addEventListener: (_: string, fn: MediaListener) => mediaListeners.push(fn),
			removeEventListener: (_: string, fn: MediaListener) => {
				mediaListeners = mediaListeners.filter((l) => l !== fn);
			},
		})),
	);
	// happy-dom's window is the global object; keep window.matchMedia in sync with the stub
	Object.defineProperty(window, "matchMedia", { value: globalThis.matchMedia, configurable: true, writable: true });
}

function runThemeScript(storageKey = "theme", defaultTheme: "light" | "dark" | "system" = "system") {
	// The script is emitted inline by the server; running it the way a browser would
	// biome-ignore lint/nursery/noImpliedEval: running the generated inline script is what this test checks
	new Function(getThemeScript(storageKey, defaultTheme))();
}

const root = () => document.documentElement;

beforeEach(() => {
	prefersDark = false;
	mediaListeners = [];
	stubMatchMedia();
	localStorage.clear();
	root().className = "";
	root().style.colorScheme = "";
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("getThemeScript", () => {
	it("follows the OS setting when nothing is stored (system)", () => {
		prefersDark = true;
		runThemeScript();
		expect(root().classList.contains("dark")).toBe(true);
		expect(root().style.colorScheme).toBe("dark");
	});

	it("uses light when the OS is light and nothing is stored", () => {
		runThemeScript();
		expect(root().classList.contains("light")).toBe(true);
		expect(root().style.colorScheme).toBe("light");
	});

	it("honours the values the previous two-state toggle stored", () => {
		prefersDark = true;
		localStorage.setItem("theme", "light");
		runThemeScript();
		expect(root().classList.contains("light")).toBe(true);
		expect(root().classList.contains("dark")).toBe(false);

		localStorage.setItem("theme", "dark");
		prefersDark = false;
		runThemeScript();
		expect(root().classList.contains("dark")).toBe(true);
		expect(root().classList.contains("light")).toBe(false);
	});

	it("treats an explicit system value like a missing one", () => {
		prefersDark = true;
		localStorage.setItem("theme", "system");
		runThemeScript();
		expect(root().classList.contains("dark")).toBe(true);
	});

	it("falls back to the default for a garbage stored value", () => {
		localStorage.setItem("theme", "<script>alert(1)</script>");
		runThemeScript("theme", "dark");
		expect(root().classList.contains("dark")).toBe(true);
	});

	it("does not throw when storage is blocked", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		prefersDark = true;
		expect(() => runThemeScript()).not.toThrow();
		// Blocked storage still applies the default theme (system: dark here)
		expect(root().classList.contains("dark")).toBe(true);
		expect(root().style.colorScheme).toBe("dark");
		vi.restoreAllMocks();
	});

	it("keeps a configured value from ending the script tag", () => {
		expect(getThemeScript("</script><b>", "dark")).not.toContain("</script>");
	});

	it("escapes the storage key and default into the script", () => {
		expect(getThemeScript('a"b', "dark")).toContain(JSON.stringify('a"b'));
	});
});

function Probe() {
	const { theme, setTheme } = useTheme();
	return (
		<div>
			<span data-testid="theme">{theme}</span>
			<button type="button" onClick={() => setTheme("dark")}>
				dark
			</button>
			<button type="button" onClick={() => setTheme("system")}>
				system
			</button>
		</div>
	);
}

describe("ThemeProvider", () => {
	it("reads the stored theme after mount", async () => {
		localStorage.setItem("theme", "dark");
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		expect(await screen.findByText("dark", { selector: "[data-testid=theme]" })).toBeTruthy();
		expect(root().classList.contains("dark")).toBe(true);
	});

	it("setTheme persists the choice and applies it", async () => {
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		await act(async () => {
			screen.getByRole("button", { name: "dark" }).click();
		});
		expect(localStorage.getItem("theme")).toBe("dark");
		expect(root().classList.contains("dark")).toBe(true);
		expect(root().style.colorScheme).toBe("dark");
	});

	it("follows the OS setting live in system mode only", async () => {
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		await act(async () => {});
		expect(root().classList.contains("light")).toBe(true);

		prefersDark = true;
		await act(async () => {
			for (const listener of mediaListeners) listener();
		});
		expect(root().classList.contains("dark")).toBe(true);

		// Once a fixed theme is chosen the OS listener is gone
		await act(async () => {
			screen.getByRole("button", { name: "dark" }).click();
		});
		expect(mediaListeners).toHaveLength(0);
	});
});
