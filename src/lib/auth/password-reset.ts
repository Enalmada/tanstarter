/** How long an emailed password-reset link works. Shared by the server policy, the email and the pages. */
export const PASSWORD_RESET_LINK_MINUTES = 60;

/**
 * Page the emailed link lands on (`redirectTo` of the reset request). better-auth's own endpoint checks the token
 * first and then sends the browser here with `?token=` (valid) or `?error=INVALID_TOKEN`. It is a public route,
 * not a `_guest` one, so a visitor who happens to be signed in does not lose the token to the guard's redirect.
 */
export const RESET_PASSWORD_PATH = "/reset-password";
