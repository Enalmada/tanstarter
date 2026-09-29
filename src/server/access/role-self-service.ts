/**
 * Whether the Profile page's self-service "Make Admin / Remove Admin" toggle
 * is allowed for the current deployment.
 *
 * Allowed only in local development (APP_ENV=development AND the runtime is
 * not a production build) or when DEMO_MODE=true is set explicitly. Uses
 * `process.env.NODE_ENV` rather than `env.NODE_ENV` on purpose: envin
 * defaults a missing NODE_ENV to "development", which would turn a
 * misconfigured production deploy into "local dev".
 *
 * Server-only (reads server env) — dynamic-import it from handlers.
 */

import { env } from "~/env";

export function isRoleSelfServiceEnabled(): boolean {
	if (env.DEMO_MODE === true) return true;
	return env.APP_ENV === "development" && process.env.NODE_ENV !== "production";
}
