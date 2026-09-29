import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "~/server/access/http-errors";

const captureException = vi.hoisted(() => vi.fn());
const PostHog = vi.hoisted(() =>
	vi.fn(function PostHog() {
		return { captureException, shutdown: vi.fn() };
	}),
);
const envMock = vi.hoisted(() => ({ shouldReportErrors: vi.fn(), getAppEnv: vi.fn() }));

vi.mock("posthog-node", () => ({ PostHog }));
vi.mock("~/env", () => envMock);
vi.mock("~/lib/env/release", () => ({ getRelease: () => "abc123" }));

async function load() {
	vi.resetModules();
	delete (globalThis as Record<string, unknown>).__tanstarterServerPosthog;
	return import("~/server/monitoring/posthog");
}

describe("captureServerException", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("PUBLIC_POSTHOG_API_KEY", "phc_test");
		envMock.shouldReportErrors.mockReturnValue(true);
		envMock.getAppEnv.mockReturnValue("staging");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("captures with env, release and caller properties", async () => {
		const { captureServerException } = await load();
		const error = new Error("boom");
		captureServerException(error, { distinctId: "usr_1", properties: { source: "nitro" } });
		expect(captureException).toHaveBeenCalledWith(error, "usr_1", {
			app_env: "staging",
			app_release: "abc123",
			source: "nitro",
		});
	});

	it("captures the same error object only once", async () => {
		const { captureServerException } = await load();
		const error = new Error("boom");
		captureServerException(error);
		captureServerException(error);
		expect(captureException).toHaveBeenCalledTimes(1);
	});

	it("skips expected errors", async () => {
		const { captureServerException } = await load();
		captureServerException(new NotFoundError("missing"));
		expect(captureException).not.toHaveBeenCalled();
	});

	it("does nothing in development", async () => {
		envMock.shouldReportErrors.mockReturnValue(false);
		const { captureServerException } = await load();
		captureServerException(new Error("boom"));
		expect(PostHog).not.toHaveBeenCalled();
		expect(captureException).not.toHaveBeenCalled();
	});

	it("does nothing without an API key", async () => {
		vi.stubEnv("PUBLIC_POSTHOG_API_KEY", "");
		const { captureServerException } = await load();
		captureServerException(new Error("boom"));
		expect(PostHog).not.toHaveBeenCalled();
	});
});
