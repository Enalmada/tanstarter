"use server";

import type { Config } from "drizzle-kit";
import { dbHelpers } from "~/env";

export default {
	out: "./app/server/db/migrations",
	schema: "./app/server/db/schema.ts",
	breakpoints: true,
	dialect: "postgresql",
	dbCredentials: {
		url: dbHelpers.getDatabaseUrl(),
	},
} satisfies Config;
