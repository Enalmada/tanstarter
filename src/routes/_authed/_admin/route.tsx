import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "~/lib/auth/guards";

// Admin-only pages. Runs after _authed, so `context.user` is the signed-in user.
// This decides where to send people; the admin server functions check the role
// themselves.
export const Route = createFileRoute("/_authed/_admin")({
	beforeLoad: ({ context }) => requireAdmin(context.user),
});
