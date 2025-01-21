import { getSerwist } from "virtual:serwist";
import mantineCoreCss from "@mantine/core/styles.css?inline";
import mantineDatesCss from "@mantine/dates/styles.css?inline";
import mantineNotificationsCss from "@mantine/notifications/styles.css?inline";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	Outlet,
	ScrollRestoration,
	createRootRouteWithContext,
	redirect,
} from "@tanstack/react-router";
import { Meta, Scripts, createServerFn } from "@tanstack/start";
import type { ReactNode } from "react";
import { Suspense, lazy, useLayoutEffect } from "react";
import { getWebRequest } from "vinxi/http";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { AnalyticsProvider } from "~/components/providers/analytics-provider";
import {
	ColorSchemeScript,
	MantineProvider,
} from "~/components/providers/mantine-provider";
import { auth } from "~/server/auth/auth";
import appCss from "~/styles/app.css?inline";
import type { SessionUser } from "~/utils/auth-client";
import { queries } from "~/utils/query/queries";

const ENABLE_SERVICE_WORKER = false;

const TanStackRouterDevtools = import.meta.env.PROD
	? () => null
	: lazy(() =>
			import("@tanstack/router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			})),
		);

export const getSessionUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const { headers } = getWebRequest();

		// In development, check for test tokens first
		// TODO consider replacing this with email login
		if (process.env.NODE_ENV === "development") {
			const authHeader = headers.get("authorization");

			if (authHeader === "playwright-test-token") {
				return mockTestUser;
			}
			if (authHeader === "playwright-admin-test-token") {
				return mockAdminUser;
			}
		}

		// Normal auth flow
		const session = await auth.api.getSession({ headers });
		return session?.user || null;
	},
);

// Mock users for testing - keep in sync with auth-guard.ts
const mockTestUser: SessionUser = {
	id: "test-user-id",
	email: "test@example.com",
	name: "Test User",
	role: "MEMBER",
	image: null,
	emailVerified: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockAdminUser: SessionUser = {
	...mockTestUser,
	id: "test-admin-id",
	email: "admin@example.com",
	name: "Test Admin",
	role: "ADMIN",
};

const isPlaywrightTest = () => {
	try {
		const { headers } = getWebRequest();
		const isPlaywright = headers.get("x-playwright-test") === "true";
		return isPlaywright;
	} catch (e) {
		// If getWebRequest fails, we're on the client
		return false;
	}
};

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
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { readonly children: ReactNode }) {
	return (
		<html suppressHydrationWarning lang="en">
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
				<Suspense>
					<AnalyticsProvider />
				</Suspense>
			</body>
		</html>
	);
}
