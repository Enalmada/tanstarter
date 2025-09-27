"use server";

import type { Config } from "drizzle-kit";

export default {
	out: "./src/server/db/migrations",
	schema: "./src/server/db/schema/index.ts",
	breakpoints: true,
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
} satisfies Config;
