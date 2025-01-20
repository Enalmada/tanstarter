import { Axiom } from "@axiomhq/js";
import { env } from "~/env";

// Only create Axiom client if token is available
const axiom = env.AXIOM_TOKEN ? new Axiom({ token: env.AXIOM_TOKEN }) : null;

const isDevelopment = process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "error";

const consoleLog = (
	level: LogLevel,
	message: string,
	data?: Record<string, unknown>,
) => {
	const timestamp = new Date().toISOString();
	const logData = data ? `\n${JSON.stringify(data, null, 2)}` : "";

	switch (level) {
		case "debug":
			console.debug(`[${timestamp}] ${message}${logData}`);
			break;
		case "info":
			console.info(`[${timestamp}] ${message}${logData}`);
			break;
		case "error":
			console.error(`[${timestamp}] ${message}${logData}`);
			break;
	}
};

const logToAxiom = async (
	level: LogLevel,
	message: string,
	data?: Record<string, unknown>,
) => {
	if (!axiom) return;

	try {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
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
