import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "~/server/access/http-errors";

const captureException = vi.hoisted(() => vi.fn());
const PostHog = vi.hoisted(() =>
	vi.fn(function PostHog(_key: string, _options: { before_send?: (event: unknown) => unknown }) {
		return { captureException, shutdown: vi.fn() };
	}),
);
const envMock = vi.hoisted(() => ({
	env: { PUBLIC_POSTHOG_API_KEY: undefined as string | undefined },
	shouldReportErrors: vi.fn(),
	getAppEnv: vi.fn(),
}));

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
		envMock.env.PUBLIC_POSTHOG_API_KEY = "phc_test";
		envMock.shouldReportErrors.mockReturnValue(true);
		envMock.getAppEnv.mockReturnValue("staging");
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
		envMock.env.PUBLIC_POSTHOG_API_KEY = undefined;
		const { captureServerException } = await load();
		captureServerException(new Error("boom"));
		expect(PostHog).not.toHaveBeenCalled();
	});

	it("sanitizes exception events before they are sent", async () => {
		const { captureServerException } = await load();
		captureServerException(new Error("boom"));
		const beforeSend = PostHog.mock.calls[0]?.[1].before_send;
		const event = {
			event: "$exception",
			properties: {
				$exception_list: [{ type: "DrizzleQueryError", value: `Failed query: insert ...${"\n"}params: a@b.c,Title` }],
			},
		};
		expect(JSON.stringify(beforeSend?.(event))).not.toContain("a@b.c");
	});
});
