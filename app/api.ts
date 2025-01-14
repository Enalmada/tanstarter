/**
 * API client configuration
 * Sets up base API instance with default config
 * Used for all API requests throughout the app
 */

import {
	createStartAPIHandler,
	defaultAPIFileRouteHandler,
} from "@tanstack/start/api";

export default createStartAPIHandler(defaultAPIFileRouteHandler);
