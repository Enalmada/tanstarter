import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
	env: {} as { AXIOM_TOKEN?: string; AXIOM_DATASET_NAME?: string; AXIOM_URL?: string },
	shouldReportErrors: vi.fn(),
}));

vi.mock("~/env", () => envMock);

const STATE_KEY = "__tanstarterAxiom";

async function load() {
	vi.resetModules();
	delete (globalThis as Record<string, unknown>)[STATE_KEY];
	return import("~/utils/logger");
}

const ok = () =>
	new Response(JSON.stringify({ ingested: 1, failed: 0, processedBytes: 1, blocksCreated: 0, walLength: 0 }));

let fetchMock: ReturnType<typeof vi.fn>;
let info: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

/** The NDJSON payload of a fetch call; Axiom gzips it when CompressionStream exists. */
async function requestEvents(call: number): Promise<Array<Record<string, unknown>>> {
	const { body, headers } = fetchMock.mock.calls[call]?.[1] as {
		body: string | Uint8Array;
		headers: Record<string, string>;
	};
	const text =
		headers["Content-Encoding"] === "gzip"
			? await new Response(new Blob([body as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"))).text()
			: String(body);
	return text
		.trim()
		.split(String.fromCharCode(10))
		.map((line) => JSON.parse(line));
}

const consoleLines = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.map(([line]) => String(line));

beforeEach(() => {
	envMock.env.AXIOM_TOKEN = "xaat-test";
	envMock.env.AXIOM_DATASET_NAME = "logs";
	delete envMock.env.AXIOM_URL;
	envMock.shouldReportErrors.mockReturnValue(true);
	fetchMock = vi.fn(async () => ok());
	vi.stubGlobal("fetch", fetchMock);
	info = vi.spyOn(console, "info").mockImplementation(() => {});
	error = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	delete (globalThis as Record<string, unknown>)[STATE_KEY];
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe("logger with Axiom enabled", () => {
	it("batches events and sends them on flush", async () => {
		const { logger, flushLogs } = await load();
		logger.info("first", { a: 1 });
		logger.info("second");
		await flushLogs();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/logs");
		const events = await requestEvents(0);
		expect(events).toMatchObject([
			{ level: "info", message: "first", a: 1 },
			{ level: "info", message: "second" },
		]);
		// Info goes to Axiom only, not the console
		expect(info).not.toHaveBeenCalled();
	});

	it("sends to AXIOM_URL when set", async () => {
		envMock.env.AXIOM_URL = "https://axiom.example.test";
		const { logger, flushLogs } = await load();
		logger.info("hello");
		await flushLogs();
		expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/^https:\/\/axiom\.example\.test\//);
	});

	it("reports a rejected ingest to the console once, without throwing or looping", async () => {
		fetchMock.mockResolvedValue(new Response("nope", { status: 401 }));
		const { logger, flushLogs } = await load();
		logger.info("will fail");
		await expect(flushLogs()).resolves.toBeUndefined();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(consoleLines(error).filter((line) => line.includes("Axiom ingest failed"))).toHaveLength(1);
	});

	it("reports a network failure the same way", async () => {
		fetchMock.mockRejectedValue(new Error("socket hang up"));
		const { logger, flushLogs } = await load();
		logger.info("will fail");
		await flushLogs();

		expect(consoleLines(error).some((line) => line.includes("Axiom ingest failed"))).toBe(true);
	});

	it("still writes error-level lines to the console", async () => {
		const { logger } = await load();
		logger.error("bad thing", { id: 1 });
		expect(error).toHaveBeenCalledWith(expect.stringContaining("ERROR bad thing"), { id: 1 });
	});

	it("gives up after the timeout when Axiom never answers", async () => {
		vi.useFakeTimers();
		fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
		const { logger, flushLogs } = await load();
		logger.info("stuck");

		const flushed = vi.fn();
		void flushLogs(3000).then(flushed);
		await vi.advanceTimersByTimeAsync(2999);
		expect(flushed).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(2);
		expect(flushed).toHaveBeenCalled();
	});

	it("shares the client between two copies of the module", async () => {
		vi.resetModules();
		delete (globalThis as Record<string, unknown>)[STATE_KEY];
		const first = await import("~/utils/logger");
		vi.resetModules();
		const second = await import("~/utils/logger");
		expect(first).not.toBe(second);

		first.logger.info("from the SSR bundle");
		await second.flushLogs(); // what the Nitro plugin does
		// Count the event, not the requests: a leftover client from an earlier test may send its own batch late
		const sent = (await Promise.all(fetchMock.mock.calls.map((_, call) => requestEvents(call)))).flat();
		expect(sent.filter((event) => event.message === "from the SSR bundle")).toHaveLength(1);
	});
});

describe("logger without Axiom", () => {
	it.each([
		["no token", () => delete envMock.env.AXIOM_TOKEN],
		["no dataset", () => delete envMock.env.AXIOM_DATASET_NAME],
		["development", () => envMock.shouldReportErrors.mockReturnValue(false)],
	])("logs to the console only (%s)", async (_name, configure) => {
		configure();
		const { logger, flushLogs } = await load();
		logger.info("local line");
		await flushLogs();

		expect(fetchMock).not.toHaveBeenCalled();
		expect(info).toHaveBeenCalledWith(expect.stringContaining("INFO local line"));
	});

	it("prints debug lines in development only", async () => {
		const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
		envMock.shouldReportErrors.mockReturnValue(false);
		let { logger } = await load();
		logger.debug("dev only");
		expect(debug).toHaveBeenCalledTimes(1);

		envMock.shouldReportErrors.mockReturnValue(true);
		({ logger } = await load());
		logger.debug("hidden");
		expect(debug).toHaveBeenCalledTimes(1);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
