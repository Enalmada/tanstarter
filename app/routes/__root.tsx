import { getSerwist } from "virtual:serwist";
import { Toaster } from "@/components/ui/sonner";
import type { QueryClient } from "@tanstack/react-query";
import {
	Outlet,
	ScrollRestoration,
	createRootRouteWithContext,
	redirect,
} from "@tanstack/react-router";
import { Meta, Scripts, createServerFn } from "@tanstack/start";
import type { ReactNode } from "react";
import { Suspense, lazy, useEffect } from "react";
import { getWebRequest } from "vinxi/http";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { auth } from "~/server/auth/auth";
import appStyles from "~/styles/app.css?inline";
import type { SessionUser } from "~/utils/auth-client";
import { queries } from "~/utils/query/queries";
import { checkPlaywrightTestAuth } from "~/utils/test/playwright";

const ENABLE_SERVICE_WORKER = false;

const TanStackRouterDevtools = import.meta.env.PROD
	? () => null
	: lazy(() =>
			import("@tanstack/router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			})),
		);

const AnalyticsProvider = lazy(() =>
	import("~/utils/analytics").then((mod) => ({
		default: mod.AnalyticsProvider,
	})),
);

export const getSessionUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const mockUser = checkPlaywrightTestAuth();
		if (mockUser) {
			return mockUser;
		}

		// Normal auth flow
		const { headers } = getWebRequest();
		const session = await auth.api.getSession({ headers });
		return session?.user || null;
	},
);

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	user: SessionUser | null | undefined;
}>()({
	beforeLoad: async ({ context, location }) => {
		const queryClient = context.queryClient;
		let user: SessionUser | null = null;

		try {
			user = await context.queryClient.ensureQueryData(queries.user.session);
		} catch (error) {
			// Handle error silently
		}

		// Cache the user data
		queryClient.setQueryData(queries.user.session.queryKey, user);

		// Check if this is a protected route
		const isProtectedRoute =
			location.pathname.startsWith("/tasks") ||
			location.pathname.startsWith("/admin");

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
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { readonly children: ReactNode }) {
	return (
		<html suppressHydrationWarning lang="en">
			<head>
				<Meta />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Required for SSR styles */}
				<style id="app-css" dangerouslySetInnerHTML={{ __html: appStyles }} />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Toaster position="bottom-right" />
				{/*}
				<ReactQueryDevtools buttonPosition="bottom-left" />

				<Suspense>
					<TanStackRouterDevtools position="bottom-right" />
				</Suspense>
				*/}
				<Scripts />
				<Suspense fallback={null}>
					<AnalyticsProvider />
				</Suspense>
			</body>
		</html>
	);
}
