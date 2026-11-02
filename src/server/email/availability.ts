/**
 * Whether verification email can be sent. Free of `~/env` and server-only
 * imports so `auth.ts` (which cannot import `~/env` for the client-side type
 * inference) and `send-email.ts` make the same decision from the same rule.
 *
 * - `send`: a provider is configured.
 * - `skip`: nothing is configured, in an explicit development or test runtime;
 *   the caller prints what it would have sent.
 * - `unavailable`: nothing is configured anywhere else. Fail closed: auth turns
 *   email sign-up off rather than creating accounts nobody can verify.
 */
export function emailDelivery(vars: {
	RESEND_API_KEY?: string | undefined;
	EMAIL_FROM?: string | undefined;
	NODE_ENV?: string | undefined;
}): "send" | "skip" | "unavailable" {
	if (vars.RESEND_API_KEY && vars.EMAIL_FROM) {
		return "send";
	}
	return vars.NODE_ENV === "development" || vars.NODE_ENV === "test" ? "skip" : "unavailable";
}
