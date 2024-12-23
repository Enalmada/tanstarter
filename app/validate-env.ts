import { validateEnv } from "./env";

// Only run validation when this file is executed directly
if (require.main === module) {
	validateEnv();
}
