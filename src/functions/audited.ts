/**
 * Wraps a server-function handler so each call leaves an `audit.mutation` log
 * line (see `~/server/auth/mutation-audit`). Apply it to every handler that
 * changes data: `.handler(audited("deleteEntity", describe, handleDeleteEntity))`.
 *
 * `describe` picks the target (entity type and id) out of the validated input;
 * it must not return field values. The server-only modules are imported inside
 * the wrapper because this file is reachable from client code (TSS-2).
 */

import type { SessionUser } from "~/server/auth/auth";
import type { MutationTarget } from "~/server/auth/mutation-audit";

type Input<D> = { data: D; context: { user: SessionUser } };

export function audited<D, R>(
	action: string,
	describe: (data: D) => MutationTarget,
	handler: (input: Input<D>) => Promise<R>,
) {
	return async (input: Input<D>): Promise<R> => {
		const { auditMutation } = await import("~/server/auth/mutation-audit");
		const { logger } = await import("~/utils/logger");
		return auditMutation(logger.info, action, describe(input.data), input.context.user, () => handler(input));
	};
}
