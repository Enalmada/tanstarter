import { afterEach, describe, expect, it } from "vitest";
import { pickPublicRuntimeEnv, readPublicRuntimeEnv, serializePublicRuntimeEnv } from "../public-env";

describe("pickPublicRuntimeEnv", () => {
	it("keeps only allowlisted APP_ENV/PUBLIC_* values", () => {
		const picked = pickPublicRuntimeEnv({
			APP_ENV: "preview",
			NODE_ENV: "production",
			PUBLIC_APP_URL: "https://example.test",
			PUBLIC_ROLLBAR_ACCESS_TOKEN: "rollbar-client",
			PUBLIC_POSTHOG_API_KEY: "phc_test",
			PUBLIC_NOT_ALLOWLISTED: "nope",
			DATABASE_URL: "postgres://secret",
			BETTER_AUTH_SECRET: "secret",
			ROLLBAR_SERVER_TOKEN: "secret",
		});

		expect(picked).toEqual({
			APP_ENV: "preview",
			PUBLIC_APP_URL: "https://example.test",
			PUBLIC_ROLLBAR_ACCESS_TOKEN: "rollbar-client",
			PUBLIC_POSTHOG_API_KEY: "phc_test",
		});
	});

	it("drops empty and non-string values", () => {
		expect(pickPublicRuntimeEnv({ APP_ENV: "", PUBLIC_APP_URL: undefined, PUBLIC_POSTHOG_API_KEY: 1 })).toEqual({});
	});
});

describe("serializePublicRuntimeEnv", () => {
	afterEach(() => {
		delete window.__PUBLIC_ENV__;
	});

	it("cannot close the surrounding script tag", () => {
		const script = serializePublicRuntimeEnv({ PUBLIC_APP_URL: "</script><script>alert(1)</script>" });

		expect(script).not.toContain("<");
	});

	it("round-trips escaped values", () => {
		const values = { APP_ENV: "staging", PUBLIC_POSTHOG_API_KEY: "phc_</script>" };
		const script = serializePublicRuntimeEnv(values);
		const prefix = "window.__PUBLIC_ENV__=";

		expect(script.startsWith(prefix)).toBe(true);
		expect(JSON.parse(script.slice(prefix.length))).toEqual(values);
	});

	it("reads the snapshot from the window global", () => {
		window.__PUBLIC_ENV__ = { APP_ENV: "staging" };

		expect(readPublicRuntimeEnv()).toEqual({ APP_ENV: "staging" });
	});

	it("reads an empty snapshot when the server rendered none", () => {
		expect(readPublicRuntimeEnv()).toEqual({});
	});
});
