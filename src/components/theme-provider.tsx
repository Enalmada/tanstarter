// https://ui.shadcn.com/docs/dark-mode/tanstack-start
import { ScriptOnce } from "@tanstack/react-router";
import { createContext, type ReactNode, use, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

function isTheme(value: unknown): value is Theme {
	return value === "light" || value === "dark" || value === "system";
}

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
	try {
		const stored = localStorage.getItem(storageKey);
		return isTheme(stored) ? stored : fallback;
	} catch {
		// Storage can be blocked (private mode, disabled cookies)
		return fallback;
	}
}

/**
 * Inline script that sets the `light`/`dark` class and `color-scheme` on <html>
 * before first paint (no flash). Emitted through `ScriptOnce`, which applies the
 * CSP nonce. A missing or invalid stored value means `defaultTheme`; the stored
 * values `light` and `dark` are the ones the previous two-state toggle wrote.
 */
export function getThemeScript(storageKey: string, defaultTheme: Theme) {
	// JSON.stringify does not escape "<": keep a "</script>" in a configured value from ending the tag
	const literal = (value: string) => JSON.stringify(value).replace(/</g, "\\u003c");
	const key = literal(storageKey);
	const fallback = literal(defaultTheme);

	// The storage read has its own try/catch: blocked storage must still apply the default theme
	return `(function(){var t=${fallback};try{var s=localStorage.getItem(${key});if(s==='light'||s==='dark'||s==='system'){t=s}}catch(e){}try{var d=matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'dark':'light'):t;var e=document.documentElement;e.classList.remove('light','dark');e.classList.add(r);e.style.colorScheme=r}catch(e){}})();`;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
	theme: "system",
	setTheme: () => {},
});

function applyTheme(theme: Theme) {
	const root = document.documentElement;
	root.classList.remove("light", "dark");

	const resolved =
		theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;

	root.classList.add(resolved);
	root.style.colorScheme = resolved;
}

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "theme" }: ThemeProviderProps) {
	// The server (and the first client render) use defaultTheme so hydration matches;
	// the effect below then reads the stored choice. The script above already set the class.
	const [theme, setThemeState] = useState<Theme>(defaultTheme);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setThemeState(readStoredTheme(storageKey, defaultTheme));
		setMounted(true);
	}, [defaultTheme, storageKey]);

	useEffect(() => {
		if (!mounted) return;
		applyTheme(theme);
	}, [theme, mounted]);

	// In system mode, follow the OS setting live
	useEffect(() => {
		if (!mounted || theme !== "system") return;

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyTheme("system");
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [theme, mounted]);

	const setTheme = (next: Theme) => {
		try {
			localStorage.setItem(storageKey, next);
		} catch {
			// Storage blocked: the choice still applies for this page view
		}
		setThemeState(next);
	};

	return (
		<ThemeProviderContext value={{ theme, setTheme }}>
			<ScriptOnce>{getThemeScript(storageKey, defaultTheme)}</ScriptOnce>
			{children}
		</ThemeProviderContext>
	);
}

export function useTheme() {
	return use(ThemeProviderContext);
}
