import { describe, expect, it } from "vitest";
import { UserRole } from "~/lib/enums/user-role";
import type { SessionUser } from "~/server/auth/auth";
import { BadRequestError } from "../http-errors";
import { assertSafeWhere, assertSafeWith, filterReadableRow, filterReadableRows } from "../read-filter";

const member = { id: "usr_member", role: UserRole.MEMBER } as SessionUser;
const admin = { id: "usr_admin", role: UserRole.ADMIN } as SessionUser;

const ownTask = { id: "tsk_1", userId: member.id, title: "mine" };
const otherTask = { id: "tsk_2", userId: "usr_other", title: "theirs" };

describe("assertSafeWhere", () => {
	const columns = ["id", "userId", "title", "status"];

	it("accepts plain equality on known columns", () => {
		expect(() => assertSafeWhere({ id: "tsk_1", userId: member.id }, columns)).not.toThrow();
		expect(() => assertSafeWhere({ title: null, status: undefined }, columns)).not.toThrow();
		expect(() => assertSafeWhere(undefined, columns)).not.toThrow();
	});

	it.each([
		["an operator object", { userId: { ne: member.id } }],
		["OR", { OR: [{ userId: "usr_other" }] }],
		["RAW", { RAW: "1=1" }],
		["an unknown column", { password: "x" }],
		["a relation filter", { user: { role: "ADMIN" } }],
		["an array value", { id: ["a", "b"] }],
	])("rejects %s", (_label, where) => {
		expect(() => assertSafeWhere(where, columns)).toThrow(BadRequestError);
	});

	it("rejects a non-object where", () => {
		expect(() => assertSafeWhere("id = 1", columns)).toThrow(BadRequestError);
		expect(() => assertSafeWhere([{ id: "x" }], columns)).toThrow(BadRequestError);
	});
});

describe("assertSafeWith", () => {
	it("accepts allowlisted relations as true", () => {
		expect(() => assertSafeWith("User", { tasks: true })).not.toThrow();
		expect(() => assertSafeWith("Task", { user: true })).not.toThrow();
		expect(() => assertSafeWith("Task", undefined)).not.toThrow();
	});

	it.each([
		["accounts (password hashes, OAuth tokens)", { accounts: true }],
		["sessions (session tokens)", { sessions: true }],
		["nested with", { tasks: { with: { user: true } } }],
		["nested where", { tasks: { where: { userId: "usr_other" } } }],
	])("rejects User.%s", (_label, withClause) => {
		expect(() => assertSafeWith("User", withClause)).toThrow(BadRequestError);
	});

	it("rejects prototype keys", () => {
		expect(() => assertSafeWith("User", JSON.parse('{"__proto__": true}'))).toThrow(BadRequestError);
		expect(() => assertSafeWith("User", { toString: true })).toThrow(BadRequestError);
	});
});

describe("filterReadableRow(s)", () => {
	it("returns null for a row the member cannot read", () => {
		expect(filterReadableRow(member, "Task", otherTask, undefined)).toBeNull();
		expect(filterReadableRow(member, "Task", ownTask, undefined)).toEqual(ownTask);
	});

	it("drops unreadable rows from lists", () => {
		expect(filterReadableRows(member, "Task", [ownTask, otherTask], undefined)).toEqual([ownTask]);
		expect(filterReadableRows(admin, "Task", [ownTask, otherTask], undefined)).toHaveLength(2);
	});

	it("filters loaded relation rows by their own subject", () => {
		const self = { id: member.id, role: UserRole.MEMBER, tasks: [ownTask, otherTask] };
		expect(filterReadableRow(member, "User", self, { tasks: true })).toEqual({ ...self, tasks: [ownTask] });

		const taskWithOtherUser = { ...ownTask, user: { id: "usr_other" } };
		expect(filterReadableRow(member, "Task", taskWithOtherUser, { user: true })).toEqual({ ...ownTask, user: null });
	});

	it("does not let a member read another user", () => {
		expect(filterReadableRow(member, "User", { id: "usr_other" }, undefined)).toBeNull();
		expect(filterReadableRow(member, "User", { id: member.id }, undefined)).toEqual({ id: member.id });
	});
});
