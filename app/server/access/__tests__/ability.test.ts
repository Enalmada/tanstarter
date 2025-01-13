import { subject } from "@casl/ability";
import { describe, expect, it } from "vitest";
import { type Task, type User, UserRole } from "../../db/schema";
import { defineAbilitiesFor } from "../ability";

describe("Permissions", () => {
	describe("when user is an admin", () => {
		const user = { id: "usr_1", role: UserRole.ADMIN } as User;
		const ability = defineAbilitiesFor(user);

		it("can do anything", () => {
			expect(ability.can("manage", "all")).toBe(true);
			expect(ability.can("list", subject("User", {}))).toBe(true);
			expect(ability.can("list", subject("Task", {}))).toBe(true);
		});
	});

	describe("when user is a member", () => {
		const user = { id: "usr_1", role: UserRole.MEMBER } as User;
		const otherUser = { id: "usr_2", role: UserRole.MEMBER } as User;
		const task = { userId: user.id } as Task;
		const otherTask = { userId: otherUser.id } as Task;
		const ability = defineAbilitiesFor(user);

		describe("own resources", () => {
			it("can read own profile", () => {
				expect(ability.can("read", subject("User", { id: user.id }))).toBe(
					true,
				);
			});

			it("can manage own tasks", () => {
				expect(ability.can("create", subject("Task", task))).toBe(true);
				expect(ability.can("read", subject("Task", task))).toBe(true);
				expect(ability.can("update", subject("Task", task))).toBe(true);
				expect(ability.can("delete", subject("Task", task))).toBe(true);
				expect(ability.can("list", subject("Task", task))).toBe(true);
			});
		});

		describe("other resources", () => {
			it("cannot read other profiles", () => {
				expect(ability.can("read", subject("User", { id: otherUser.id }))).toBe(
					false,
				);
			});

			it("cannot manage other tasks", () => {
				expect(ability.can("create", subject("Task", otherTask))).toBe(false);
				expect(ability.can("read", subject("Task", otherTask))).toBe(false);
				expect(ability.can("update", subject("Task", otherTask))).toBe(false);
				expect(ability.can("delete", subject("Task", otherTask))).toBe(false);
				expect(ability.can("list", subject("Task", otherTask))).toBe(false);
			});
		});

		describe("admin actions", () => {
			it("cannot perform admin actions", () => {
				expect(ability.can("manage", "all")).toBe(false);
				expect(ability.can("list", subject("User", {}))).toBe(false);
			});
		});
	});

	describe("when user is undefined", () => {
		const ability = defineAbilitiesFor(undefined);

		it("cannot do anything", () => {
			expect(ability.can("manage", "all")).toBe(false);
			expect(ability.can("list", subject("User", {}))).toBe(false);
			expect(ability.can("list", subject("Task", {}))).toBe(false);
		});
	});
});
