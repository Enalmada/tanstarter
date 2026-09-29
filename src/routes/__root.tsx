/// <reference types="vite/client" />
// TODO: Re-enable when Serwist Vite plugin is working with Nitro v3
// import { getSerwist } from "virtual:serwist";

import type { I18n } from "@lingui/core";
import { useLingui } from "@lingui/react";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, ScriptOnce, Scripts } from "@tanstack/react-router";
import { type ComponentType, lazy, type ReactNode, Suspense, useEffect } from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/toast";
import { env } from "~/env";
import { sessionQueryOptions } from "~/lib/auth/session";
import { pickPublicRuntimeEnv, serializePublicRuntimeEnv } from "~/lib/env/public-env";
import appCss from "~/styles/app.css?url";

// TODO: Enable service worker when you're ready to use PWA features
// The service worker is built by scripts/vite-service-worker.ts during `vite build`
//
// BEST PRACTICE: Service workers should run in BOTH dev and prod:
//   - Dev mode: Uses NetworkOnly strategy (no caching, always fresh)
//   - Prod mode: Uses full caching strategies (offline support)
//   Benefits: Test SW lifecycle in dev, catch bugs early, develop PWA features
//
// CURRENT LIMITATION: sw.js is only built by `vite build`
//   (scripts/vite-service-worker.ts), so registration is production-only.
//
// To enable:
//   1. Change to: const ENABLE_SERVICE_WORKER = import.meta.env.PROD;
//   2. Test in production build (bun run build && bun run start)
//   3. Verify sw.js is accessible at /sw.js in browser
//   4. Check browser DevTools > Application > Service Workers
//
// NOTE: Service worker only works with HTTPS or localhost
// See docs/sessions/serwist_support.md for full details
const ENABLE_SERVICE_WORKER = import.meta.env.PROD;
const ENABLE_DEVTOOLS = false; // Set to true to show DevTools button in development

// Allowlisted APP_ENV/PUBLIC_* values for the browser, read from the server's
// runtime env (Fly secrets) instead of being baked in at build time. See
// src/lib/env/public-env.ts. Server-only: ScriptOnce renders nothing on the client.
const PUBLIC_ENV_SCRIPT = typeof window === "undefined" ? serializePublicRuntimeEnv(pickPublicRuntimeEnv(env)) : "";

// Devtools load only in dev with ENABLE_DEVTOOLS on. The check must stay a
// build-time constant around each `import(...)`: the bundler emits a chunk for
// every dynamic import it can still see, even one inside a function that never
// runs. In production that pulled the devtools UI (browser-only Solid
// templates) into a shared server chunk, and SSR threw on every request.
const SHOW_DEVTOOLS = import.meta.env.DEV && ENABLE_DEVTOOLS;
const NoDevtool: ComponentType = () => null;

const Devtools: ComponentType = SHOW_DEVTOOLS ? lazy(() => import("~/components/Devtools")) : NoDevtool;

const AnalyticsProvider = lazy(() =>
	import("~/utils/analytics").then((mod) => ({
		default: mod.AnalyticsProvider,
	})),
);

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	i18n: I18n;
}>()({
	// Prime the session in the query cache: the layout and analytics read it on
	// every page, and the _guest/_authed guards reuse it.
	beforeLoad: async ({ context }) => {
		try {
			await context.queryClient.query(sessionQueryOptions());
		} catch (_error) {
			// A failed session lookup is treated as signed out
			context.queryClient.setQueryData(sessionQueryOptions().queryKey, null);
		}
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{ name: "color-scheme", content: "light dark" },
			{ title: "TanStarter" },
			{
				name: "description",
				content: "A modern starter template using TanStack Start",
			},
			{
				name: "theme-color",
				content: "#8936FF",
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "default",
			},
			{
				name: "mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:title",
				content: "TanStarter",
			},
			{
				property: "og:description",
				content: "A modern starter template using TanStack and Vite",
			},
			{
				name: "twitter:card",
				content: "summary",
			},
			{
				name: "twitter:title",
				content: "TanStarter",
			},
			{
				name: "twitter:description",
				content: "A modern starter template using TanStack and Vite",
			},
		],
		links: [
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "shortcut icon", href: "/favicon.ico" },
			{
				rel: "apple-touch-icon",
				href: "/icon512_rounded.png",
			},
			{
				rel: "apple-touch-icon",
				href: "/icon512_maskable.png",
				sizes: "512x512",
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	// The HTML document wraps every match, including the error and not-found views
	shellComponent: RootDocument,
	component: RootComponent,
	errorComponent: DefaultCatchBoundary,
	notFoundComponent: () => <NotFound />,
});

function RootComponent() {
	useEffect(() => {
		const loadSerwist = async () => {
			if (ENABLE_SERVICE_WORKER && "serviceWorker" in navigator) {
				try {
					// TODO: Uncomment when Serwist Vite plugin is enabled
					// const serwist = await getSerwist();
					// serwist?.addEventListener("installed", () => {});
					// await serwist?.register();

					// Direct registration (works without Serwist Vite plugin)
					await navigator.serviceWorker.register("/sw.js", {
						scope: "/",
					});
				} catch (_error) {
					// Service worker registration failed (expected in dev - sw.js not generated)
				}
			}
		};

		// loadSerwist catches registration errors itself.
		void loadSerwist();
	}, []);

	return <Outlet />;
}

function RootDocument({ children }: { readonly children: ReactNode }) {
	const { i18n } = useLingui();
	return (
		<html suppressHydrationWarning lang={i18n.locale}>
			<head>
				<HeadContent />
			</head>
			<body>
				{/* Must precede <Scripts />: env.config.ts reads it when the client entry loads. */}
				<ScriptOnce>{PUBLIC_ENV_SCRIPT}</ScriptOnce>
				<ThemeProvider>
					{children}
					<Toaster />
				</ThemeProvider>
				{SHOW_DEVTOOLS && (
					<Suspense>
						<Devtools />
					</Suspense>
				)}
				<Scripts />
				<Suspense fallback={null}>
					<AnalyticsProvider />
				</Suspense>
			</body>
		</html>
	);
}
