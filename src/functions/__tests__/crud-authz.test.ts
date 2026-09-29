/**
 * Authorization behavior of the generic CRUD handlers, with real CASL rules
 * (only the DB and the session are faked).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleDeleteEntity } from "~/functions/delete-entity";
import { handleFindFirst } from "~/functions/find-first";
import { handleFindMany } from "~/functions/find-many";
import { handleUpdateEntity } from "~/functions/update-entity";
import { UserRole } from "~/lib/enums/user-role";
import { BadRequestError, ConflictError, NotAuthorizedError, NotFoundError } from "~/server/access/http-errors";

const member = { id: "usr_member", role: UserRole.MEMBER };
const ownTask = { id: "tsk_own", userId: member.id, title: "mine", version: 1 };
const otherTask = { id: "tsk_other", userId: "usr_other", title: "theirs", version: 1 };

const state = vi.hoisted(() => ({
	rows: [] as Record<string, unknown>[],
	selected: [] as Record<string, unknown>[],
	writeReturnsNothing: false,
	deleted: vi.fn(),
	updated: vi.fn(),
}));

vi.mock("~/server/access/check", async (importOriginal) => importOriginal());

// Real predicate, spied, so tests can prove the handlers write through it
// with the row they authorized (the DB mock itself ignores predicates).
const writeGuard = vi.hoisted(() => ({ spy: vi.fn() }));
vi.mock("~/server/access/write-guard", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/server/access/write-guard")>();
	writeGuard.spy.mockImplementation(actual.authorizedRowPredicate);
	return { authorizedRowPredicate: writeGuard.spy };
});

vi.mock("~/server/db", () => ({
	default: {
		select: () => ({
			from: () => ({
				where: () => {
					const result = Promise.resolve(state.selected) as Promise<unknown> & { limit: () => Promise<unknown> };
					result.limit = () => Promise.resolve(state.selected);
					return result;
				},
			}),
		}),
		delete: () => ({
			where: () => ({
				returning: async () => {
					state.deleted();
					return state.writeReturnsNothing ? [] : state.selected;
				},
			}),
		}),
		update: () => ({
			set: (values: Record<string, unknown>) => ({
				where: () => ({
					returning: async () => {
						state.updated(values);
						return state.writeReturnsNothing ? [] : [{ ...state.selected[0], ...values }];
					},
				}),
			}),
		}),
	},
}));

vi.mock("~/functions/base-service", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/functions/base-service")>();
	const { pgTable, text, integer } = await import("drizzle-orm/pg-core");
	const TaskTable = pgTable("task", {
		id: text().primaryKey(),
		userId: text("user_id"),
		title: text(),
		version: integer(),
	});
	const passthrough = { "~standard": { version: 1, vendor: "test", validate: (value: unknown) => ({ value }) } };
	return {
		...actual,
		getUser: async () => member,
		loadEntityConfig: async () => ({
			Task: {
				table: TaskTable,
				query: {
					findFirst: async () => state.rows[0],
					findMany: async () => state.rows,
				},
				schemas: { select: passthrough, insert: passthrough, update: passthrough },
			},
		}),
	};
});

vi.mock("valibot", async (importOriginal) => {
	const actual = await importOriginal<typeof import("valibot")>();
	return {
		...actual,
		// Let the fake "update" schema above pass values through untouched.
		safeParse: (schema: unknown, input: unknown) =>
			schema && typeof schema === "object" && "~standard" in schema && !("kind" in schema)
				? { success: true, output: input, issues: undefined }
				: actual.safeParse(schema as never, input),
	};
});

beforeEach(() => {
	state.rows = [];
	state.selected = [];
	state.writeReturnsNothing = false;
	writeGuard.spy.mockClear();
	state.deleted.mockClear();
	state.updated.mockClear();
});

describe("findFirst", () => {
	it("treats another user's task exactly like a missing one", async () => {
		state.rows = [otherTask];
		await expect(handleFindFirst({ data: { subject: "Task", where: { id: otherTask.id } } })).rejects.toBeInstanceOf(
			NotFoundError,
		);

		state.rows = [];
		await expect(handleFindFirst({ data: { subject: "Task", where: { id: "nope" } } })).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});

	it("returns the caller's own task", async () => {
		state.rows = [ownTask];
		await expect(handleFindFirst({ data: { subject: "Task", where: { id: ownTask.id } } })).resolves.toEqual(ownTask);
	});

	it("rejects operator filters and unknown relations before querying", async () => {
		await expect(
			handleFindFirst({ data: { subject: "Task", where: { userId: { ne: member.id } } } }),
		).rejects.toBeInstanceOf(BadRequestError);
		await expect(
			handleFindFirst({ data: { subject: "Task", where: { id: ownTask.id }, with: { accounts: true } } }),
		).rejects.toBeInstanceOf(BadRequestError);
	});
});

describe("findMany", () => {
	it("drops rows the caller cannot read", async () => {
		state.rows = [ownTask, otherTask];
		await expect(handleFindMany({ data: { subject: "Task", where: { userId: member.id } } })).resolves.toEqual([
			ownTask,
		]);
	});

	it("forbids listing without the caller's own userId filter", async () => {
		await expect(handleFindMany({ data: { subject: "Task", where: {} } })).rejects.toBeInstanceOf(NotAuthorizedError);
	});
});

describe("deleteEntity", () => {
	it("reports another user's task as not found and does not delete it", async () => {
		state.selected = [otherTask];
		await expect(handleDeleteEntity({ data: { subject: "Task", id: otherTask.id } })).rejects.toBeInstanceOf(
			NotFoundError,
		);
		expect(state.deleted).not.toHaveBeenCalled();
	});
});

describe("write predicate", () => {
	it("requires the authorized owner and version, not just the id", async () => {
		const { PgDialect } = await import("drizzle-orm/pg-core");
		const { authorizedRowPredicate } = await import("~/server/access/write-guard");
		const { loadEntityConfig } = await import("~/functions/base-service");
		const { table } = (await loadEntityConfig()).Task;
		const { sql, params } = new PgDialect().sqlToQuery(authorizedRowPredicate(table, ownTask));
		expect(sql).toContain('"user_id"');
		expect(sql).toContain('"version"');
		expect(params).toEqual([ownTask.id, ownTask.userId, ownTask.version]);
	});
});

describe("handlers write through the guard", () => {
	it("update passes the authorized row to the write predicate", async () => {
		state.selected = [ownTask];
		await handleUpdateEntity({ data: { subject: "Task", id: ownTask.id, data: { version: 1, title: "x" } } });
		expect(writeGuard.spy).toHaveBeenCalledTimes(1);
		expect(writeGuard.spy.mock.calls[0]?.[1]).toBe(ownTask);
	});

	it("delete passes the authorized row to the write predicate", async () => {
		state.selected = [ownTask];
		await handleDeleteEntity({ data: { subject: "Task", id: ownTask.id } });
		expect(writeGuard.spy).toHaveBeenCalledTimes(1);
		expect(writeGuard.spy.mock.calls[0]?.[1]).toBe(ownTask);
	});
});

describe("deleteEntity race", () => {
	it("reports not found when the row changed between check and delete", async () => {
		state.selected = [ownTask];
		state.writeReturnsNothing = true;
		await expect(handleDeleteEntity({ data: { subject: "Task", id: ownTask.id } })).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});
});

describe("updateEntity", () => {
	it("returns a conflict when the row changed between check and write", async () => {
		state.selected = [ownTask];
		state.writeReturnsNothing = true;
		await expect(
			handleUpdateEntity({ data: { subject: "Task", id: ownTask.id, data: { version: 1, title: "x" } } }),
		).rejects.toBeInstanceOf(ConflictError);
	});

	it("reports another user's task as not found before any version check", async () => {
		state.selected = [otherTask];
		const stale = handleUpdateEntity({ data: { subject: "Task", id: otherTask.id, data: { version: 99 } } });
		await expect(stale).rejects.toBeInstanceOf(NotFoundError);
		expect(state.updated).not.toHaveBeenCalled();
	});

	it("returns a conflict for the caller's own stale task", async () => {
		state.selected = [ownTask];
		const stale = handleUpdateEntity({ data: { subject: "Task", id: ownTask.id, data: { version: 99 } } });
		await expect(stale).rejects.toBeInstanceOf(ConflictError);
	});

	it("forbids moving the caller's task to another user", async () => {
		state.selected = [ownTask];
		const move = handleUpdateEntity({
			data: { subject: "Task", id: ownTask.id, data: { version: 1, userId: "usr_other" } },
		});
		await expect(move).rejects.toBeInstanceOf(NotAuthorizedError);
		expect(state.updated).not.toHaveBeenCalled();
	});

	it("never writes server-managed fields from the client patch", async () => {
		state.selected = [ownTask];
		await handleUpdateEntity({
			data: {
				subject: "Task",
				id: ownTask.id,
				data: { version: 1, title: "renamed", id: "tsk_hijack", createdById: "usr_other" },
			},
		});
		const written = state.updated.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(written).toMatchObject({ title: "renamed", version: 2, updatedById: member.id });
		expect(written).not.toHaveProperty("id");
		expect(written).not.toHaveProperty("createdById");
	});
});
