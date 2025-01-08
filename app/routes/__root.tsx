import { getSerwist } from "virtual:serwist";
import { AppShell } from "@mantine/core";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	Outlet,
	ScrollRestoration,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { Meta, Scripts, createServerFn } from "@tanstack/start";
import type { ReactNode } from "react";
import { Suspense, lazy, useLayoutEffect } from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { Navbar } from "~/components/Navbar";
import { NotFound } from "~/components/NotFound";
import {
	ColorSchemeScript,
	MantineProvider,
} from "~/components/providers/mantine-provider";
import { getAuthSession } from "~/server/auth/auth";
import type { ClientUser } from "~/server/db/schema";

import mantineCoreCss from "@mantine/core/styles.css?inline";
import mantineDatesCss from "@mantine/dates/styles.css?inline";
import mantineNotificationsCss from "@mantine/notifications/styles.css?inline";
// Import CSS with ?inline to ensure proper SSR handling
import appCss from "~/styles/app.css?inline";

const ENABLE_SERVICE_WORKER = false;

const TanStackRouterDevtools = import.meta.env.PROD
	? () => null
	: lazy(() =>
			import("@tanstack/router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			})),
		);

const USER_QUERY_KEY = ["auth", "user"] as const;

const getUser = createServerFn({ method: "GET" }).handler(async () => {
	const { user } = await getAuthSession();
	return user;
});

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	user: ClientUser | null | undefined;
}>()({
	beforeLoad: async ({ context }) => {
		const queryClient = context.queryClient;
		// Try to get user from query cache first
		const cachedUser = queryClient.getQueryData<ClientUser | null>(
			USER_QUERY_KEY,
		);
		if (cachedUser !== undefined) {
			return { user: cachedUser };
		}

		// If not in cache, fetch and cache it
		const user = await getUser();
		queryClient.setQueryData<ClientUser | null>(USER_QUERY_KEY, user);
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
			if (ENABLE_SERVICE_WORKER && "serviceWorker" in navigator) {
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
			<AppShell header={{ height: 60 }}>
				<AppShell.Header>
					<Navbar user={user} />
				</AppShell.Header>
				<AppShell.Main>
					<Outlet />
				</AppShell.Main>
			</AppShell>
		</RootDocument>
	);
}

function RootDocument({ children }: { readonly children: ReactNode }) {
	return (
		<html suppressHydrationWarning>
			<head>
				<Meta />
				<ColorSchemeScript />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
				<style dangerouslySetInnerHTML={{ __html: mantineCoreCss }} />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
				<style dangerouslySetInnerHTML={{ __html: mantineNotificationsCss }} />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
				<style dangerouslySetInnerHTML={{ __html: mantineDatesCss }} />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
				<style dangerouslySetInnerHTML={{ __html: appCss }} />
			</head>
			<body>
				<MantineProvider>{children}</MantineProvider>
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
