/**
 * Errors that are part of normal control flow and must not become PostHog
 * issues: router redirects and not-founds, and 4xx domain errors.
 *
 * Shared by the client and server capture paths, so it imports nothing
 * server-only (http-errors.ts is stdlib-only by design).
 */

import { isNotFound, isRedirect } from "@tanstack/react-router";
import { hasHttpErrorHints } from "~/server/access/http-errors";

// authErrorTranslator rethrows domain errors to the client as a plain Error
// that keeps only the original name, so the client matches on it.
const EXPECTED_ERROR_NAMES = new Set(["BadRequestError", "NotAuthorizedError", "NotFoundError", "ConflictError"]);

export function isExpectedError(error: unknown): boolean {
	if (isRedirect(error) || isNotFound(error)) return true;
	if (hasHttpErrorHints(error)) return error.httpStatus < 500;
	if (!(error instanceof Error)) return false;
	if (EXPECTED_ERROR_NAMES.has(error.name)) return true;
	// h3/Nitro HTTPError and similar carry a numeric `status`
	const status = (error as { status?: unknown }).status;
	return typeof status === "number" && status >= 400 && status < 500;
}
