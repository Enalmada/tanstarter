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
import type { ReactNode } from "react";
import { Suspense, lazy, useLayoutEffect } from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { Navbar } from "~/components/Navbar";
import { NotFound } from "~/components/NotFound";
import { NextUIAppProvider } from "~/components/providers/next-ui-provider";
import { getAuthSession } from "~/server/auth/auth";
import type { ClientUser } from "~/server/db/schema";
import appCss from "~/styles/app.css?url";

const TanStackRouterDevtools = import.meta.env.PROD
	? () => null
	: lazy(() =>
			import("@tanstack/router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			})),
		);

const getUser = createServerFn({ method: "GET" }).handler(async () => {
	const { user } = await getAuthSession();
	return user;
});

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	user: ClientUser | null;
}>()({
	beforeLoad: async () => {
		const user = await getUser();
		return { user };
	},
	loader: ({ context }) => {
		return {
			user: context.user,
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
	errorComponent: (props) => (
		<RootDocument>
			<DefaultCatchBoundary {...props} />
		</RootDocument>
	),
	notFoundComponent: () => <NotFound />,
});

function RootComponent() {
	const { user } = Route.useLoaderData();

	useLayoutEffect(() => {
		const loadSerwist = async () => {
			if ("serviceWorker" in navigator) {
				try {
					const serwist = await getSerwist();
					serwist?.addEventListener("installed", () => {
						console.info("Service worker registration successful");
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
			<div className="flex min-h-screen flex-col">
				<Navbar user={user} />
				<div className="flex-1">
					<Outlet />
				</div>
			</div>
		</RootDocument>
	);
}

function RootDocument({ children }: { readonly children: ReactNode }) {
	return (
		<html suppressHydrationWarning>
			<head>
				<Meta />
				<ScriptOnce>
					{`
					// Only run on client side
					if (typeof window !== 'undefined') {
						// Initialize dark mode before React hydration
						(function() {
							const isDarkMode = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
							document.documentElement.classList.toggle('dark', isDarkMode);
							
							// Listen for system theme changes
							const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
							mediaQuery.addEventListener('change', function(e) {
								const newIsDark = e.matches;
								localStorage.theme = newIsDark ? 'dark' : 'light';
								document.documentElement.classList.toggle('dark', newIsDark);
							});
						})();
					}
					`}
				</ScriptOnce>
			</head>
			<body>
				<NextUIAppProvider>
					<main className="min-h-screen">{children}</main>
				</NextUIAppProvider>
				<ScrollRestoration />
				<ReactQueryDevtools buttonPosition="bottom-left" />
				<Suspense>
					<TanStackRouterDevtools position="bottom-right" />
				</Suspense>
				<Scripts />
			</body>
		</html>
	);
}
