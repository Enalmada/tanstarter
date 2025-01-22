import { useRouter } from "@tanstack/react-router";
import posthog from "posthog-js";
import { useEffect, useLayoutEffect } from "react";
import { env } from "~/env";
import { Route } from "~/routes/__root";
import type { SessionUser } from "~/utils/auth-client";

export function initializeAnalytics() {
	if (typeof window === "undefined") return;

	if (env.PUBLIC_POSTHOG_API_KEY) {
		posthog.init(env.PUBLIC_POSTHOG_API_KEY, {
			api_host: "https://us.i.posthog.com",
			person_profiles: "identified_only",
			loaded: (posthog) => {
				if (window.location.href.includes("localhost")) {
					posthog.debug();
				}
			},
			// Disable features in development
			disable_session_recording: process.env.NODE_ENV !== "production",
			enable_heatmaps: process.env.NODE_ENV === "production",
			capture_performance: process.env.NODE_ENV === "production",
		});
	}
}

export function identifyUser(user: SessionUser | null) {
	if (!posthog) return;

	if (user) {
		const currentDistinctId = posthog.get_distinct_id();

		// Only identify if the current distinct ID is not the user's ID
		if (currentDistinctId !== user.id) {
			posthog.identify(user.id, {
				email: user.email,
				name: user.name,
				role: user.role,
			});
		}
	}
}

export function capturePageView(options?: { isPrefetch?: boolean }) {
	// Don't capture prefetch events
	if (options?.isPrefetch) return;

	// Use requestAnimationFrame to debounce and ensure we only capture once per actual navigation
	if (typeof window !== "undefined") {
		window.requestAnimationFrame(() => {
			if (posthog) {
				posthog.capture("$pageview");
			}
		});
	}
}

export { posthog };

export function AnalyticsProvider() {
	const router = useRouter();
	const { user } = Route.useLoaderData();

	useLayoutEffect(() => {
		initializeAnalytics();
	}, []);

	// Handle user identification separately
	useEffect(() => {
		identifyUser(user);
	}, [user]);

	// Router subscription only needs to happen once, and only for navigation events
	useEffect(() => {
		return router.subscribe("onLoad", () => {
			capturePageView();
		});
	}, [router]);

	return null;
}
