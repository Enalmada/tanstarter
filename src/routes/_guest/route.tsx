import { createFileRoute } from "@tanstack/react-router";
import { redirectIfSignedIn } from "~/lib/auth/guards";

// Pages for visitors who are not signed in (sign-in, sign-up). Signed-in users
// go to ?redirect= (validated by safeRedirect) or /tasks.
export const Route = createFileRoute("/_guest")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: ({ context, search }) => redirectIfSignedIn(context.queryClient, search.redirect),
});
