/**
 * Structured logger: the console always, plus Axiom when it is configured.
 *
 * Axiom's `ingest` only queues the event and returns nothing, so there is nothing to
 * await or catch. Send failures are reported through the client's `onError` option
 * instead, and `flushLogs` drains the queue on shutdown (see the Nitro plugin).
 *
 * The client lives on globalThis because the Nitro plugin that flushes it and the SSR
 * bundle that logs to it can each get their own copy of this module.
 */

import "@tanstack/react-start/server-only";
import { Axiom } from "@axiomhq/js";
import { env, shouldReportErrors } from "~/env";

type LogLevel = "debug" | "info" | "error";
type LogData = Record<string, unknown>;

interface AxiomSink {
	client: Axiom;
	dataset: string;
}

const STATE_KEY = "__tanstarterAxiom";
type GlobalWithState = typeof globalThis & { [STATE_KEY]?: { sink: AxiomSink | null } };

// The logger is the one sanctioned console sink (Biome's noConsole applies
// everywhere else).
const consoleLog = (level: LogLevel, message: string, data?: LogData) => {
	const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
	const args = data ? [line, data] : [line];

	switch (level) {
		case "debug":
			// biome-ignore lint/suspicious/noConsole: logger console sink
			console.debug(...args);
			break;
		case "info":
			// biome-ignore lint/suspicious/noConsole: logger console sink
			console.info(...args);
			break;
		case "error":
			// biome-ignore lint/suspicious/noConsole: logger console sink
			console.error(...args);
			break;
	}
};

function getSink(): AxiomSink | null {
	const g = globalThis as GlobalWithState;
	if (!g[STATE_KEY]) {
		// Development never ships logs: a local .env with a real token would otherwise
		// write into the production dataset.
		const enabled = env.AXIOM_TOKEN && env.AXIOM_DATASET_NAME && shouldReportErrors();
		g[STATE_KEY] = {
			sink: enabled
				? {
						client: new Axiom({
							token: env.AXIOM_TOKEN as string,
							...(env.AXIOM_URL ? { url: env.AXIOM_URL } : {}),
							// Straight to the console: routing a send failure back through
							// `logger` would loop while Axiom is down.
							onError: (error) => consoleLog("error", "Axiom ingest failed", { error: describeError(error) }),
						}),
						dataset: env.AXIOM_DATASET_NAME as string,
					}
				: null,
		};
	}
	return g[STATE_KEY].sink;
}

function describeError(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function log(level: Exclude<LogLevel, "debug">, message: string, data?: LogData) {
	const sink = getSink();

	// Fly's log stream is the fallback when Axiom is down, so errors always reach it.
	// Info goes to the console only when nothing else receives it.
	if (level === "error" || !sink) {
		consoleLog(level, message, data);
	}

	sink?.client.ingest(sink.dataset, [{ _time: new Date(), level, message, ...data }]);
}

export const logger = {
	info: (message: string, data?: LogData) => log("info", message, data),
	error: (message: string, data?: LogData) => log("error", message, data),
	// Development only: debug output never reaches Axiom or a production console.
	debug: (message: string, data?: LogData) => {
		if (!shouldReportErrors()) consoleLog("debug", message, data);
	},
};

/**
 * Send whatever is still queued for Axiom. Never rejects (failures go to `onError`) and
 * gives up after `timeoutMs`, so a slow Axiom cannot hold shutdown past Fly's kill timeout.
 */
export async function flushLogs(timeoutMs = 3000) {
	const sink = (globalThis as GlobalWithState)[STATE_KEY]?.sink;
	if (!sink) return;

	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		await Promise.race([
			sink.client.flush(),
			new Promise<void>((resolve) => {
				timer = setTimeout(resolve, timeoutMs);
			}),
		]);
	} finally {
		clearTimeout(timer);
	}
}
