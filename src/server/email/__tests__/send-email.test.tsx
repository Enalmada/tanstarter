/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
	env: {} as { RESEND_API_KEY?: string; EMAIL_FROM?: string },
}));

vi.mock("~/env", () => ({ env: state.env }));

const message = { to: "person@example.com", subject: "Hello", react: <p>Hi</p> };

async function send() {
	const { sendEmail } = await import("../send-email");
	return sendEmail(message);
}

beforeEach(() => {
	delete state.env.RESEND_API_KEY;
	delete state.env.EMAIL_FROM;
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe("without a provider", () => {
	it.each(["development", "test"])("skips sending in %s", async (nodeEnv) => {
		vi.stubEnv("NODE_ENV", nodeEnv);
		expect(await send()).toBe(false);
	});

	it.each(["production", "staging", ""])("throws when NODE_ENV is %j", async (nodeEnv) => {
		vi.stubEnv("NODE_ENV", nodeEnv);
		await expect(send()).rejects.toThrow("Email is not configured");
	});
});

describe("with a provider", () => {
	beforeEach(() => {
		vi.stubEnv("NODE_ENV", "production");
		state.env.RESEND_API_KEY = "re_test_key"; // betterleaks:allow
		state.env.EMAIL_FROM = "App <no-reply@example.com>";
	});

	it("posts the rendered message with the key and sender", async () => {
		const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		expect(await send()).toBe(true);

		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe("https://api.resend.com/emails");
		expect(new Headers(init.headers).get("authorization")).toBe("Bearer re_test_key");
		expect(JSON.parse(String(init.body))).toMatchObject({
			from: "App <no-reply@example.com>",
			to: "person@example.com",
			subject: "Hello",
			html: expect.stringContaining("Hi"),
		});
	});

	it("throws on a rejected message without echoing the response body", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("domain not verified: secret-detail", { status: 403 })),
		);

		const failure = send();
		await expect(failure).rejects.toThrow("HTTP 403");
		await expect(failure).rejects.not.toThrow("secret-detail");
	});
});
