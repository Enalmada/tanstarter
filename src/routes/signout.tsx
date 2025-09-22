import { createFileRoute, redirect } from "@tanstack/react-router";
import { posthog } from "~/utils/analytics";
import authClient from "~/utils/auth-client";

export const Route = createFileRoute("/signout")({
	component: SignOutPage,
	beforeLoad: async ({ context, preload }) => {
		// Skip signout logic during preload/prefetch
		if (preload) {
			return null;
		}

		// Reset PostHog user identification
		if (posthog) {
			posthog.reset();
		}

		// Sign out from auth
		await authClient.signOut();

		// Clear React Query cache
		context.queryClient.clear();

		// Redirect to home page
		throw redirect({
			to: "/",
		});
	},
});

function SignOutPage() {
	return null; // This component won't render as we redirect in loader
}
