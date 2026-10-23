import "@tanstack/react-start/server-only";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { env } from "~/env";

/**
 * Sends one transactional email through Resend's HTTP API. Returns `false` when
 * no provider is configured outside production (local dev, tests), so callers
 * can print what they would have sent. In production a missing key or a
 * rejected message throws, because a silently dropped verification email
 * locks the user out.
 */
export async function sendEmail({
	to,
	subject,
	react,
}: {
	to: string;
	subject: string;
	react: ReactElement;
}): Promise<boolean> {
	const { RESEND_API_KEY: apiKey, EMAIL_FROM: from } = env;
	if (!apiKey || !from) {
		if (env.NODE_ENV === "production") {
			throw new Error("Email is not configured: set RESEND_API_KEY and EMAIL_FROM");
		}
		return false;
	}

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
		body: JSON.stringify({ from, to, subject, html: await render(react) }),
		signal: AbortSignal.timeout(10_000),
	});
	if (!response.ok) {
		throw new Error(`Email provider rejected the message (HTTP ${response.status})`);
	}
	return true;
}
