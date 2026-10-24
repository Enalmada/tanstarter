/**
 * Shared by the server (better-auth enforces it on sign-up and reset) and the
 * sign-up form, so the two cannot drift. Length is the rule; there are no
 * composition requirements. Existing shorter passwords still sign in.
 */
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
