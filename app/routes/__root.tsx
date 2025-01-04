import { getSerwist } from "virtual:serwist";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	Outlet,
	ScriptOnce,
	ScrollRestoration,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { Meta, Scripts, createServerFn } from "@tanstack/start";
import { Suspense, lazy, useLayoutEffect } from "react";

import { getAuthSession } from "~/server/auth/auth";
import appCss from "~/styles/app.css?url";

const TanStackRouterDevtools = import.meta.env.PROD
	? () => null // Render nothing in production
	: lazy(() =>
			// Lazy load in development
			import("@tanstack/router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			})),
		);

const getUser = createServerFn({ method: "GET" }).handler(async () => {
	const { user } = await getAuthSession();
	return user;
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		beforeLoad: async () => {
			const user = await getUser();
			return { user };
		},
		head: () => ({
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					title: "TanStarter",
				},
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
				{ rel: "stylesheet", href: appCss },
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
			],
		}),
		component: RootComponent,
	},
);

function RootComponent() {
	useLayoutEffect(() => {
		const loadSerwist = async () => {
			if ("serviceWorker" in navigator) {
				try {
					const serwist = await getSerwist();
					serwist?.addEventListener("installed", () => {
						console.info("Service worker registration succesful");
					});
					await serwist?.register();
				} catch (error) {
					console.error("Service worker registration failed:", error);
				}
			}
		};

		loadSerwist();
	}, []);

	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
	return (
		<html>
			<head>
				<Meta />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<ReactQueryDevtools buttonPosition="bottom-left" />
				<Suspense>
					<TanStackRouterDevtools position="bottom-right" />
				</Suspense>

				<ScriptOnce>
					{`document.documentElement.classList.toggle(
            'dark',
            localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
            )`}
				</ScriptOnce>

				<Scripts />
			</body>
		</html>
	);
}
