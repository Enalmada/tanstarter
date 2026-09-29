import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "~/lib/auth/guards";

// Everything under here needs a signed-in user. `context.user` is non-null in
// child routes. The session query is the source of truth: after a role or
// profile change, invalidate it and then the router (see the profile page).
export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ context, location }) => ({
		user: await requireUser(context.queryClient, location),
	}),
});
