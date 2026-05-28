/**
 * Global function middleware that translates typed domain errors
 * (anything implementing HttpErrorHints) to HTTP status + safe wire
 * message. Handlers throw the right error type; this middleware does
 * the translation.
 *
 * Wire-payload safety contract: rethrows a plain Error with the
 * safeMessage and the original error name. NO `cause` attached —
 * TanStack Start's seroval serializer walks own-property names and
 * would emit `cause` verbatim, leaking rich diagnostic (rule details,
 * owning user IDs, stack traces) to the client. Server-side correlation
 * is preserved via logger calls below.
 */

import { createMiddleware } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { logger } from "~/utils/logger";
import { hasHttpErrorHints } from "./http-errors";

export const authErrorTranslator = createMiddleware({ type: "function" }).server(async ({ next }) => {
	try {
		return await next();
	} catch (err) {
		if (hasHttpErrorHints(err)) {
			setResponseStatus(err.httpStatus);
			// Log server-side for Axiom correlation (4xx info, 5xx error).
			const logFn = err.httpStatus >= 500 ? logger.error : logger.info;
			logFn(`[authErrorTranslator] ${err.name}`, {
				message: err.message,
				httpStatus: err.httpStatus,
			});
			// Rethrow bare Error — no cause, no extra properties beyond name + message.
			const wireError = new Error(err.safeMessage);
			wireError.name = err.name;
			throw wireError;
		}
		throw err;
	}
});
