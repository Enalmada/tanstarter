import { afterEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ env: { APP_ENV: "development", DEMO_MODE: undefined as boolean | undefined } }));
vi.mock("~/env", () => env);

import { isRoleSelfServiceEnabled } from "../role-self-service";

describe("isRoleSelfServiceEnabled", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		env.env.APP_ENV = "development";
		env.env.DEMO_MODE = undefined;
	});

	it("is on for local development", () => {
		vi.stubEnv("NODE_ENV", "development");
		expect(isRoleSelfServiceEnabled()).toBe(true);
	});

	it("is off for a production build even if APP_ENV says development", () => {
		vi.stubEnv("NODE_ENV", "production");
		expect(isRoleSelfServiceEnabled()).toBe(false);
	});

	it.each(["preview", "staging", "production"])("is off for APP_ENV=%s", (appEnv) => {
		vi.stubEnv("NODE_ENV", "development");
		env.env.APP_ENV = appEnv;
		expect(isRoleSelfServiceEnabled()).toBe(false);
	});

	it("is on anywhere when DEMO_MODE=true", () => {
		vi.stubEnv("NODE_ENV", "production");
		env.env.APP_ENV = "production";
		env.env.DEMO_MODE = true;
		expect(isRoleSelfServiceEnabled()).toBe(true);
	});
});
