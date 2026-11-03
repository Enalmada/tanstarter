/**
 * @vitest-environment node
 */

import { render } from "@react-email/render";
import { isValidElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
	env: { PUBLIC_APP_URL: "https://app.example.com" } as { PUBLIC_APP_URL?: string },
	sendEmail: vi.fn(),
	logger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("~/env", () => ({ env: state.env }));
vi.mock("../send-email", () => ({ sendEmail: state.sendEmail }));
vi.mock("~/utils/logger", () => ({ logger: state.logger }));

const user = { email: "person@example.com" };
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mailModule() {
	return import("../password-reset");
}

beforeEach(() => {
	state.sendEmail.mockReset();
	state.logger.info.mockReset();
	state.logger.error.mockReset();
	state.env.PUBLIC_APP_URL = "https://app.example.com";
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("sendResetPasswordEmail", () => {
	it("returns before the send finishes, so the request does not wait for it", async () => {
		state.sendEmail.mockReturnValue(new Promise(() => {}));
		const { sendResetPasswordEmail } = await mailModule();

		expect(sendResetPasswordEmail({ user, url: "https://app.example.com/api/auth/reset-password/t" })).toBeUndefined();
		await flush();
		expect(state.sendEmail).toHaveBeenCalledTimes(1);
	});

	it("mails the link to the address", async () => {
		state.sendEmail.mockResolvedValue(true);
		const { sendResetPasswordEmail } = await mailModule();
		const url = "https://app.example.com/api/auth/reset-password/t?callbackURL=%2Freset-password";

		sendResetPasswordEmail({ user, url });
		await flush();

		const message = state.sendEmail.mock.calls[0]?.[0];
		expect(message.to).toBe(user.email);
		expect(isValidElement(message.react)).toBe(true);
		expect(await render(message.react)).toContain("api/auth/reset-password/t");
	});

	it("prints the link when no provider is configured, so a developer can follow it", async () => {
		state.sendEmail.mockResolvedValue(false);
		const { sendResetPasswordEmail } = await mailModule();
		const url = "https://app.example.com/api/auth/reset-password/t";

		sendResetPasswordEmail({ user, url });
		await flush();

		expect(state.logger.info).toHaveBeenCalledWith(expect.stringContaining("not sent"), { resetUrl: url });
	});

	it("logs a failed send without the link or the address and does not throw", async () => {
		state.sendEmail.mockRejectedValue(new Error("Email provider rejected the message (HTTP 500)"));
		const { sendResetPasswordEmail } = await mailModule();

		sendResetPasswordEmail({ user, url: "https://app.example.com/api/auth/reset-password/secret-token" });
		await flush();

		expect(state.logger.error).toHaveBeenCalledTimes(1);
		const logged = JSON.stringify(state.logger.error.mock.calls);
		expect(logged).not.toContain("secret-token");
		expect(logged).not.toContain(user.email);
	});
});

describe("sendAccountExistsEmail", () => {
	it("links to the sign-in and reset pages of the configured app URL", async () => {
		state.sendEmail.mockResolvedValue(true);
		const { sendAccountExistsEmail } = await mailModule();

		sendAccountExistsEmail({ user });
		await flush();

		const message = state.sendEmail.mock.calls[0]?.[0];
		expect(message.to).toBe(user.email);
		const html = await render(message.react);
		expect(html).toContain("https://app.example.com/signin");
		expect(html).toContain("https://app.example.com/forgot-password");
	});

	it("falls back to localhost when no app URL is set", async () => {
		state.env.PUBLIC_APP_URL = "";
		state.sendEmail.mockResolvedValue(true);
		const { sendAccountExistsEmail } = await mailModule();

		sendAccountExistsEmail({ user });
		await flush();

		expect(await render(state.sendEmail.mock.calls[0]?.[0].react)).toContain("http://localhost:3000/signin");
	});

	it("does not print links when no provider is configured", async () => {
		state.sendEmail.mockResolvedValue(false);
		const { sendAccountExistsEmail } = await mailModule();

		sendAccountExistsEmail({ user });
		await flush();

		expect(state.logger.info).toHaveBeenCalledWith(expect.stringContaining("not sent"), {});
	});
});
