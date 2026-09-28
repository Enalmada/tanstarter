import { Axiom } from "@axiomhq/js";
import { env } from "~/env";

// Only create Axiom client if token is available
const axiom = env.AXIOM_TOKEN ? new Axiom({ token: env.AXIOM_TOKEN }) : null;

const isDevelopment = process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "error";

// The logger is the one sanctioned console sink (Biome's noConsole applies
// everywhere else).
const consoleLog = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
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

const logToAxiom = async (level: LogLevel, message: string, data?: Record<string, unknown>) => {
	if (!axiom) return;

	try {
		// biome-ignore lint/style/noNonNullAssertion: AXIOM_DATASET_NAME is required in production
		await axiom.ingest(env.AXIOM_DATASET_NAME!, [
			{
				_time: new Date(),
				level,
				message,
				...data,
			},
		]);
	} catch (error) {
		// If Axiom logging fails, fallback to console
		consoleLog("error", "Axiom logging failed", {
			error: error instanceof Error ? error.message : "Unknown error",
			originalMessage: message,
			originalData: data,
		});
	}
};

export const logger = {
	info: (message: string, data?: Record<string, unknown>) => {
		if (isDevelopment || !axiom) {
			consoleLog("info", message, data);
		}
		// logToAxiom catches its own failures; fire-and-forget is intended.
		void logToAxiom("info", message, data);
	},

	error: (message: string, data?: Record<string, unknown>) => {
		if (isDevelopment || !axiom) {
			consoleLog("error", message, data);
		}
		void logToAxiom("error", message, data);
	},

	debug: (message: string, data?: Record<string, unknown>) => {
		if (isDevelopment) {
			consoleLog("debug", message, data);
			void logToAxiom("debug", message, data);
		}
	},
};

// Optional: Type-safe way to create structured logs
export const createStructuredLogger = (component: string) => ({
	info: (message: string, data?: Record<string, unknown>) => {
		logger.info(message, { component, ...data });
	},
	error: (message: string, data?: Record<string, unknown>) => {
		logger.error(message, { component, ...data });
	},
	debug: (message: string, data?: Record<string, unknown>) => {
		logger.debug(message, { component, ...data });
	},
});
