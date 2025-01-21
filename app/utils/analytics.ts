import { useRouter } from "@tanstack/react-router";
import posthog from "posthog-js";
import { useLayoutEffect } from "react";
import { env } from "~/env";

export function initializeAnalytics() {
	// Only initialize PostHog in the browser and when we have an API key
	if (typeof window !== "undefined" && env.PUBLIC_POSTHOG_API_KEY) {
		posthog.init(env.PUBLIC_POSTHOG_API_KEY, {
			api_host: "https://us.i.posthog.com",
			person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
			// Setting up for future Partytown integration
			loaded: (posthog) => {
				if (window.location.href.includes("localhost")) {
					// Add local debugging
					posthog.debug();
				}
			},
		});
	}
}

export function usePageView() {
	const router = useRouter();

	useLayoutEffect(() => {
		// Function to capture pageview
		function capturePageView() {
			if (typeof window !== "undefined" && env.PUBLIC_POSTHOG_API_KEY) {
				posthog.capture("$pageview");
			}
		}

		// Capture initial pageview
		capturePageView();

		// Subscribe to route changes
		return router.subscribe("onResolved", () => {
			capturePageView();
		});
	}, [router]);
}

export { posthog };
