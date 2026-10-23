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

// Ids come from the client; keep a malformed one from bloating the log line.
const MAX_ID_LENGTH = 64;

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
	// A logging problem must neither fail a change that already happened nor
	// replace the error that made it fail. Fields are listed one by one so a
	// descriptor that returns more than a target cannot put it in the log.
	const line = async (outcome: "success" | "failure", status?: number, createdId?: string) => {
		try {
			const id = target.id ?? createdId;
			write("audit.mutation", {
				action,
				outcome,
				...(status ? { status } : {}),
				...(target.subject ? { subject: target.subject } : {}),
				...(id ? { id: id.slice(0, MAX_ID_LENGTH) } : {}),
				...(target.detail ? { detail: target.detail } : {}),
				userId: user.id,
				ip: await clientIp(),
			});
		} catch {}
	};

	try {
		const result = await run();
		// A create has no id until it runs: take only the id, never the row.
		const created = typeof result === "object" && result !== null && "id" in result ? result.id : undefined;
		await line("success", undefined, typeof created === "string" ? created : undefined);
		return result;
	} catch (error) {
		await line("failure", hasHttpErrorHints(error) ? error.httpStatus : 500);
		throw error;
	}
}
