/**
 * Server-only helper for resolving the per-request `Request` object
 * from TanStack Start's AsyncLocalStorage context.
 *
 * `getRequest()` throws (not returns undefined) when the context isn't
 * active — which happens routinely during SSR query prefetch / dehydration
 * in `@tanstack/react-start` v1.134+. Every direct caller of `getRequest()`
 * needs to wrap the call in try/catch, return `null` on failure, and
 * decide whether the missing context is fatal or recoverable.
 *
 * This helper centralizes that wrap so the rule lives in ONE place. If
 * the framework's `getRequest` semantics change again, one edit here
 * fixes the whole codebase. See the SKILL.md "`getRequest()` defensive
 * try/catch (REQUIRED)" section for the full rationale.
 *
 * This module is server-only and is dynamic-imported by createServerFn
 * handlers / middleware — it MUST NOT be imported at the top level of
 * any file reachable from a client route. The Vite import-protection
 * plugin enforces this on v1.167+.
 */

export async function getSessionRequest(): Promise<Request | null> {
	const { getRequest } = await import("@tanstack/react-start/server");
	try {
		return getRequest() ?? null;
	} catch {
		// Context not active (e.g. SSR initialization). Caller decides
		// whether this is fatal (throw) or recoverable (return null).
		return null;
	}
}
