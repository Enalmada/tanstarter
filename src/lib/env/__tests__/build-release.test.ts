import { afterEach, describe, expect, it, vi } from "vitest";
import { getBuildRelease } from "../build-release";

describe("getBuildRelease", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("prefers RELEASE_VERSION", () => {
		vi.stubEnv("RELEASE_VERSION", "abc1234");
		vi.stubEnv("FLY_IMAGE_REF", "registry.fly.io/app:deployment-01ABC");
		expect(getBuildRelease()).toBe("abc1234");
	});

	it("falls back to the FLY_IMAGE_REF tag", () => {
		vi.stubEnv("RELEASE_VERSION", "");
		vi.stubEnv("FLY_IMAGE_REF", "registry.fly.io/app:deployment-01ABC");
		expect(getBuildRelease()).toBe("deployment-01ABC");
	});

	it("is undefined when neither is set, so nothing is uploaded under a guessed version", () => {
		vi.stubEnv("RELEASE_VERSION", " ");
		vi.stubEnv("FLY_IMAGE_REF", "");
		expect(getBuildRelease()).toBeUndefined();
	});
});
