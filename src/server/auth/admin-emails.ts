/**
 * `ADMIN_EMAILS` bootstrap: promote listed emails to ADMIN when their user
 * row is first created by a verified sign-in.
 *
 * Promotion happens ONLY at user creation and ONLY when the new row is
 * already `emailVerified` (i.e. created by an OAuth provider that verified
 * the address). Email/password sign-ups are always created unverified, so
 * nobody can claim a listed address by registering it with a password
 * before its owner signs in. Never promote on sign-in or account link —
 * that is exactly the account-squatting path (better-auth advisory fixed
 * in 1.6.11; 1.7+ also refuses implicit linking onto unverified rows).
 *
 * Pure module: no env/DB imports, so it's unit-testable and safe to import
 * from `auth.ts`.
 */

export function parseAdminEmails(raw: string | undefined): Set<string> {
	if (!raw) return new Set();
	return new Set(
		raw
			.split(",")
			.map((email) => email.trim().toLowerCase())
			.filter((email) => email.length > 0),
	);
}

export function shouldPromoteOnCreate(
	user: { email?: string | null; emailVerified?: boolean | null },
	rawAdminEmails: string | undefined,
): boolean {
	if (user.emailVerified !== true || !user.email) return false;
	return parseAdminEmails(rawAdminEmails).has(user.email.trim().toLowerCase());
}
