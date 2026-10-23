import { describe, expect, it } from "vitest";
import { emailDelivery } from "../availability";

const configured = { RESEND_API_KEY: "key", EMAIL_FROM: "App <no-reply@example.com>" }; // betterleaks:allow

describe("emailDelivery", () => {
	it("sends whenever a provider is configured", () => {
		expect(emailDelivery({ ...configured, NODE_ENV: "production" })).toBe("send");
	});

	it("skips only in an explicit development or test runtime", () => {
		expect(emailDelivery({ NODE_ENV: "development" })).toBe("skip");
		expect(emailDelivery({ NODE_ENV: "test" })).toBe("skip");
	});

	it("is unavailable everywhere else, and when only half the settings are present", () => {
		expect(emailDelivery({ NODE_ENV: "production" })).toBe("unavailable");
		expect(emailDelivery({ NODE_ENV: "staging" })).toBe("unavailable");
		expect(emailDelivery({})).toBe("unavailable");
		expect(emailDelivery({ RESEND_API_KEY: "key", NODE_ENV: "production" })).toBe("unavailable");
	});
});
