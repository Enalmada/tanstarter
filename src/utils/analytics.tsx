import { useRouter } from "@tanstack/react-router";
import posthog from "posthog-js";
import { useEffect, useLayoutEffect } from "react";
import { initPosthog } from "~/lib/monitoring/client";
import { Route } from "~/routes/__root";
import type { SessionUser } from "~/utils/auth-client";

// One PostHog init for analytics and error tracking (idempotent; src/client.tsx
// usually runs it first).
export function initializeAnalytics() {
	initPosthog();
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
