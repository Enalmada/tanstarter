import "@tanstack/react-start/server-only";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { env } from "~/env";
import { emailDelivery } from "./availability";

/**
 * Sends one transactional email through Resend's HTTP API. Returns `false` when
 * no provider is configured in local development or tests, so callers can print
 * what they would have sent. Anywhere else a missing key or a rejected message
 * throws. (Auth also refuses email sign-up when nothing is configured, so no
 * account is created whose link cannot be sent.)
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
	// `process.env.NODE_ENV` rather than `env.NODE_ENV`, which envin defaults to
	// "development" when unset, so a misconfigured deploy would skip silently.
	const delivery = emailDelivery({ RESEND_API_KEY: apiKey, EMAIL_FROM: from, NODE_ENV: process.env.NODE_ENV });
	if (delivery === "skip") {
		return false;
	}
	if (delivery === "unavailable" || !apiKey || !from) {
		throw new Error("Email is not configured: set RESEND_API_KEY and EMAIL_FROM");
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
