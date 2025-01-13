import type { ClientUser } from "../db/schema";
import { type Action, type SubjectType, defineAbilitiesFor } from "./ability";

export type { Action, SubjectType };

export class NotAuthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NotAuthorizedError";
	}
}

/**
 * Checks if a user has permission to perform an action on a subject
 * @throws NotAuthorizedError if the user doesn't have permission
 */
export function accessCheck(
	user: ClientUser | undefined,
	action: Action,
	subjectType: SubjectType,
	criteria: Record<string, unknown> = {},
	field?: string,
) {
	const ability = defineAbilitiesFor(user);
	const subjectData = { ...criteria, __caslSubjectType__: subjectType };

	if (ability.cannot(action, subjectData, field)) {
		throw new NotAuthorizedError(
			`You do not have permission to ${action} ${subjectType}.`,
		);
	}
}
