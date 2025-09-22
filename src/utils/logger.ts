import { Axiom } from "@axiomhq/js";
import { env } from "~/env";

// Only create Axiom client if token is available
const axiom = env.AXIOM_TOKEN ? new Axiom({ token: env.AXIOM_TOKEN }) : null;

const isDevelopment = process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "error";

const consoleLog = (level: LogLevel, _message: string, data?: Record<string, unknown>) => {
	const _timestamp = new Date().toISOString();
	const _logData = data ? `\n${JSON.stringify(data, null, 2)}` : "";

	switch (level) {
		case "debug":
			break;
		case "info":
			break;
		case "error":
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
		logToAxiom("info", message, data);
	},

	error: (message: string, data?: Record<string, unknown>) => {
		if (isDevelopment || !axiom) {
			consoleLog("error", message, data);
		}
		logToAxiom("error", message, data);
	},

	debug: (message: string, data?: Record<string, unknown>) => {
		if (isDevelopment) {
			consoleLog("debug", message, data);
			logToAxiom("debug", message, data);
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
