/**
 * Environment validation entry point
 * Validates required environment variables on startup
 * Ensures all necessary configuration is present
 */

import { validateEnv } from "./env";

// Only run validation when this file is executed directly
if (require.main === module) {
	validateEnv();
}
