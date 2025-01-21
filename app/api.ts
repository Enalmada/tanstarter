/**
 * API client configuration
 * Sets up base API instance with default config
 * Used for all API requests throughout the app
 */

import {
	createStartAPIHandler,
	defaultAPIFileRouteHandler,
} from "@tanstack/start/api";
import { monitor } from "~/lib/monitoring";

// Wrap the default handler with error logging
const enhancedHandler = async (
	ctx: Parameters<typeof defaultAPIFileRouteHandler>[0],
) => {
	try {
		return await defaultAPIFileRouteHandler(ctx);
	} catch (error) {
		monitor.error("API Error:", error);
		throw error;
	}
};

export default createStartAPIHandler(enhancedHandler);
