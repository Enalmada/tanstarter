/**
 * Audit trail for state-changing server functions: one structured line per
 * call, success or failure, with the user id and the client IP (see ./audit for
 * the sign-in side).
 *
 * Lines carry the action, the entity type and id, the outcome and the HTTP
 * status of a failure. They never carry field values, the user's email or the
 * error message (a message can quote data). They go through the logger, so they
 * reach Axiom when it is configured.
 */

import { getIP } from "better-auth/api";
import { hasHttpErrorHints } from "~/server/access/http-errors";
import { authIpAddress } from "./ip-address";
import { getSessionRequest } from "./request";

// `detail` is for a short fixed vocabulary (a role name), never client-supplied text.
export type MutationTarget = { subject?: string; id?: string; detail?: string };

type MutationWriter = (message: string, data: Record<string, unknown>) => void;

async function clientIp(): Promise<string | null> {
	const request = await getSessionRequest();
	return request ? getIP(request, { advanced: { ipAddress: authIpAddress } }) : null;
}

/** Runs `run`, writes the audit line for its outcome, and passes the result or the error through. */
export async function auditMutation<T>(
	write: MutationWriter,
	action: string,
	target: MutationTarget,
	user: { id: string },
	run: () => Promise<T>,
): Promise<T> {
	const line = async (outcome: "success" | "failure", status?: number) =>
		write("audit.mutation", {
			action,
			outcome,
			...(status ? { status } : {}),
			...target,
			userId: user.id,
			ip: await clientIp(),
		});

	try {
		const result = await run();
		await line("success");
		return result;
	} catch (error) {
		await line("failure", hasHttpErrorHints(error) ? error.httpStatus : 500);
		throw error;
	}
}
