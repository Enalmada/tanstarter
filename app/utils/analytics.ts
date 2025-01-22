import posthog from "posthog-js";
import { env } from "~/env";
import type { SessionUser } from "./auth-client";
import { isClient } from "./env";

export function initializeAnalytics() {
	// Only initialize PostHog in the browser and when we have an API key
	if (isClient() && env.PUBLIC_POSTHOG_API_KEY) {
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
			/* // TODO: when nonce is supported
			prepare_external_dependency_script:(script) => {
				script.nonce = '<your-nonce-value>'
				return script
			},
			*/
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

	if (posthog) {
		posthog.capture("$pageview");
	}
}

export { posthog };
