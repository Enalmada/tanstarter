import type { SessionUser } from "~/server/auth/auth";
import { type Action, defineAbilitiesFor, type SubjectType } from "./ability";
// Re-export from the central HTTP error vocabulary so callers keep importing
// from ./check, but the type carries HTTP translation hints used by the
// global authErrorTranslator middleware.
import { NotAuthorizedError } from "./http-errors";

export type { Action, SubjectType };
export { NotAuthorizedError };

/**
 * Checks if a user has permission to perform an action on a subject
 * @throws NotAuthorizedError if the user doesn't have permission — the
 *   authErrorTranslator middleware maps this to HTTP 403 + safeMessage.
 */
export function accessCheck(
	user: SessionUser | undefined,
	action: Action,
	subjectType: SubjectType,
	criteria: Record<string, unknown> = {},
	field?: string,
) {
	const ability = defineAbilitiesFor(user);
	const subjectData = { ...criteria, __caslSubjectType__: subjectType };

	if (ability.cannot(action, subjectData, field)) {
		throw new NotAuthorizedError(`You do not have permission to ${action} ${subjectType}.`);
	}
}
