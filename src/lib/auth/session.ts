/**
 * Client-safe session access. One query key (`["user", "session"]`) for the
 * signed-in user (or null), shared by the route guards, the layout and
 * analytics. Import only client-safe modules here (this file is bundled for
 * the browser).
 */

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getSessionUser } from "~/functions/session";

export function sessionQueryOptions() {
	return queryOptions({
		queryKey: ["user", "session"] as const,
		queryFn: () => getSessionUser(),
	});
}

/** The signed-in user, or null when anonymous. Suspends until the session is cached. */
export function useSessionUser() {
	return useSuspenseQuery(sessionQueryOptions()).data;
}
