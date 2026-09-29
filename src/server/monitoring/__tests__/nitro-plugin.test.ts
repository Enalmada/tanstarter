import { beforeEach, describe, expect, it, vi } from "vitest";

const shutdownServerPosthog = vi.hoisted(() => vi.fn());
const captureServerException = vi.hoisted(() => vi.fn());
const flushLogs = vi.hoisted(() => vi.fn());

vi.mock("nitro", () => ({ definePlugin: (plugin: unknown) => plugin }));
vi.mock("../posthog", () => ({ shutdownServerPosthog, captureServerException }));
vi.mock("~/utils/logger", () => ({ flushLogs }));

async function closeHook() {
	const hooks = new Map<string, () => Promise<void>>();
	const { default: plugin } = (await import("../nitro-plugin")) as unknown as {
		default: (app: { hooks: { hook: (name: string, fn: () => Promise<void>) => void } }) => void;
	};
	plugin({ hooks: { hook: (name, fn) => hooks.set(name, fn) } });
	const close = hooks.get("close");
	if (!close) throw new Error("close hook not registered");
	return close;
}

describe("nitro close hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		shutdownServerPosthog.mockResolvedValue(undefined);
		flushLogs.mockResolvedValue(undefined);
	});

	it("flushes PostHog and the log queue", async () => {
		await (await closeHook())();
		expect(shutdownServerPosthog).toHaveBeenCalledTimes(1);
		expect(flushLogs).toHaveBeenCalledTimes(1);
	});

	it("still flushes the logs when the PostHog shutdown rejects", async () => {
		shutdownServerPosthog.mockRejectedValue(new Error("posthog down"));
		await expect((await closeHook())()).resolves.toBeUndefined();
		expect(flushLogs).toHaveBeenCalledTimes(1);
	});

	it("starts both flushes together", async () => {
		let releasePosthog: () => void = () => {};
		shutdownServerPosthog.mockReturnValue(new Promise<void>((resolve) => (releasePosthog = resolve)));
		const done = (await closeHook())();
		await Promise.resolve();
		expect(flushLogs).toHaveBeenCalledTimes(1); // did not wait for PostHog
		releasePosthog();
		await done;
	});
});
