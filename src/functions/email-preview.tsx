import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { freshAuthMiddleware } from "~/functions/auth-middleware";
import type { SessionUser } from "~/server/auth/auth";

/**
 * Render the welcome email preview HTML on the server.
 *
 * `@react-email/render` and the email templates are server-only: rendering in
 * the route loader put them in the client entry chunk, where the build's
 * `external` list left a bare `@react-email/render` import that the browser
 * cannot resolve, breaking hydration on every page in production.
 */
export const handleRenderWelcomePreview = createServerOnlyFn(
	async ({ context }: { context: { user: SessionUser } }) => {
		const { user } = context;
		if (user.role !== "ADMIN") {
			const { NotAuthorizedError } = await import("~/server/access/http-errors");
			throw new NotAuthorizedError(`User ${user.id} may not preview emails`);
		}

		const [{ render }, { WelcomeEmail }, { welcomeEmailPreview }] = await Promise.all([
			import("@react-email/render"),
			import("~/emails/WelcomeEmail"),
			import("~/emails/preview-data"),
		]);
		return render(<WelcomeEmail {...welcomeEmailPreview} />);
	},
);

export const renderWelcomePreview = createServerFn({ method: "GET" })
	.middleware([freshAuthMiddleware])
	.handler(handleRenderWelcomePreview);
