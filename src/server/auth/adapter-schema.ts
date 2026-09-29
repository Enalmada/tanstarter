/**
 * Maps better-auth's default model names to our Drizzle tables, for the
 * relations-v2 adapter.
 *
 * Do not rename the models with `modelName` in auth.ts. With joins on, the
 * adapter derives relation keys from the model names ("account" -> `accounts`,
 * "user"), which are the ones in `db/schema/relations.ts`. Custom names such as
 * "AccountTable" would ask for `AccountTables` and break password sign-in and
 * uncached session lookups. Passing this map (instead of `import * as schema`)
 * also keeps the adapter away from unrelated schema exports.
 */

import { AccountTable, SessionTable, UserTable, VerificationTable } from "~/server/db/schema/auth.schema";

export const authAdapterSchema = {
	user: UserTable,
	session: SessionTable,
	account: AccountTable,
	verification: VerificationTable,
};
