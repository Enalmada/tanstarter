/**
 * HTTP error vocabulary for the auth-error-translation pattern.
 *
 * IMPORTANT: This file imports ONLY from the standard library.
 * It is intentionally Drizzle-free, CASL-free, and auth-free so it
 * can be top-level-imported from createServerFn files without leaking
 * server-only code into the client bundle (TSS-2 rule).
 *
 * The structural `HttpErrorHints` contract lets future domain error
 * types get HTTP translation for free by implementing the interface.
 */

export interface HttpErrorHints {
	readonly httpStatus: number;
	readonly safeMessage: string;
}

export function hasHttpErrorHints(err: unknown): err is Error & HttpErrorHints {
	if (!(err instanceof Error)) return false;
	const hints = err as unknown as Record<string, unknown>;
	const status = hints.httpStatus;
	if (typeof status !== "number" || !Number.isInteger(status) || status < 100 || status > 599) {
		return false;
	}
	return typeof hints.safeMessage === "string";
}

export class BadRequestError extends Error implements HttpErrorHints {
	readonly httpStatus = 400;
	readonly safeMessage: string;
	constructor(message: string, options?: { safeMessage?: string; cause?: unknown }) {
		super(message, options?.cause ? { cause: options.cause } : undefined);
		this.name = "BadRequestError";
		this.safeMessage = options?.safeMessage ?? message;
	}
}

export class NotAuthorizedError extends Error implements HttpErrorHints {
	readonly httpStatus = 403;
	readonly safeMessage: string;
	constructor(message: string, options?: { safeMessage?: string; cause?: unknown }) {
		super(message, options?.cause ? { cause: options.cause } : undefined);
		this.name = "NotAuthorizedError";
		this.safeMessage = options?.safeMessage ?? "Forbidden";
	}
}

export class NotFoundError extends Error implements HttpErrorHints {
	readonly httpStatus = 404;
	readonly safeMessage: string;
	constructor(message: string, options?: { safeMessage?: string; cause?: unknown }) {
		super(message, options?.cause ? { cause: options.cause } : undefined);
		this.name = "NotFoundError";
		this.safeMessage = options?.safeMessage ?? "Not found";
	}
}

export class ConflictError extends Error implements HttpErrorHints {
	readonly httpStatus = 409;
	readonly safeMessage: string;
	constructor(message: string, options?: { safeMessage?: string; cause?: unknown }) {
		super(message, options?.cause ? { cause: options.cause } : undefined);
		this.name = "ConflictError";
		this.safeMessage = options?.safeMessage ?? message;
	}
}
