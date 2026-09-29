/// <reference types="vite/client" />
// TODO: Re-enable when Serwist Vite plugin is working with Nitro v3
// import { getSerwist } from "virtual:serwist";

import type { I18n } from "@lingui/core";
import { useLingui } from "@lingui/react";
import type { TanStackDevtoolsReactInit } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, redirect, ScriptOnce, Scripts } from "@tanstack/react-router";
import { type ComponentType, lazy, type ReactNode, Suspense, useEffect } from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { Toaster } from "~/components/ui/sonner";
import { env } from "~/env";
import { pickPublicRuntimeEnv, serializePublicRuntimeEnv } from "~/lib/env/public-env";
import appCss from "~/styles/app.css?url";
import type { SessionUser } from "~/utils/auth-client";
import { queries } from "~/utils/query/queries";

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

const TanStackDevtools: ComponentType<TanStackDevtoolsReactInit> = SHOW_DEVTOOLS
	? lazy(() => import("@tanstack/react-devtools").then((res) => ({ default: res.TanStackDevtools })))
	: NoDevtool;

const ReactQueryDevtoolsPanel: ComponentType = SHOW_DEVTOOLS
	? lazy(() => import("@tanstack/react-query-devtools").then((res) => ({ default: res.ReactQueryDevtoolsPanel })))
	: NoDevtool;

const TanStackRouterDevtoolsPanel: ComponentType = SHOW_DEVTOOLS
	? lazy(() => import("@tanstack/router-devtools").then((res) => ({ default: res.TanStackRouterDevtoolsPanel })))
	: NoDevtool;

const AnalyticsProvider = lazy(() =>
	import("~/utils/analytics").then((mod) => ({
		default: mod.AnalyticsProvider,
	})),
);

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	user: SessionUser | null | undefined;
	i18n: I18n;
}>()({
	beforeLoad: async ({ context, location }) => {
		const queryClient = context.queryClient;
		let user: SessionUser | null = null;

		try {
			user = await context.queryClient.query(queries.user.session);
		} catch (_error) {
			// Handle error silently
		}

		// Cache the user data
		queryClient.setQueryData(queries.user.session.queryKey, user);

		// Check if this is a protected route
		const isProtectedRoute = location.pathname.startsWith("/tasks") || location.pathname.startsWith("/admin");

		if (isProtectedRoute && !user) {
			throw redirect({ to: "/signin" });
		}

		return { user };
	},
	loader: ({ context }) => {
		return {
			user: context.user ?? null,
		};
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
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
	component: RootComponent,
	errorComponent: (props) => (
		<RootDocument>
			<DefaultCatchBoundary {...props} />
		</RootDocument>
	),
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

	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
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
				<ScriptOnce>
					{`document.documentElement.classList.toggle(
						'dark',
						localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
					)`}
				</ScriptOnce>
				{children}
				<Toaster position="bottom-right" />
				{SHOW_DEVTOOLS && (
					<Suspense>
						<TanStackDevtools
							plugins={[
								{
									name: "TanStack Query",
									render: <ReactQueryDevtoolsPanel />,
								},
								{
									name: "TanStack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
							]}
						/>
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
