/**
 * Drizzle ORM v1 Relations (RQBv2)
 * Centralized relation definitions using defineRelations
 * https://orm.drizzle.team/docs/relations-v1-v2
 */

import { defineRelations } from "drizzle-orm";
import { AccountTable, SessionTable, UserTable, VerificationTable } from "./auth.schema";
import { TaskTable } from "./task.schema";

const schema = { UserTable, SessionTable, AccountTable, VerificationTable, TaskTable };

export const relations = defineRelations(schema, (r) => ({
	UserTable: {
		sessions: r.many.SessionTable({
			from: r.UserTable.id,
			to: r.SessionTable.userId,
		}),
		accounts: r.many.AccountTable({
			from: r.UserTable.id,
			to: r.AccountTable.userId,
		}),
		tasks: r.many.TaskTable({
			from: r.UserTable.id,
			to: r.TaskTable.userId,
		}),
	},
	SessionTable: {
		user: r.one.UserTable({
			from: r.SessionTable.userId,
			to: r.UserTable.id,
		}),
	},
	AccountTable: {
		user: r.one.UserTable({
			from: r.AccountTable.userId,
			to: r.UserTable.id,
		}),
	},
	TaskTable: {
		user: r.one.UserTable({
			from: r.TaskTable.userId,
			to: r.UserTable.id,
		}),
	},
}));
