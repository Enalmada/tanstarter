import { describe, expect, it } from "vitest";
import { type User, UserRole } from "../../db/schema";
import { NotAuthorizedError, accessCheck } from "../check";

describe("accessCheck", () => {
	const user = { id: "usr_1", role: UserRole.MEMBER } as User;
	const admin = { id: "usr_2", role: UserRole.ADMIN } as User;

	describe("when user is a member", () => {
		it("allows access to own resources", () => {
			expect(() =>
				accessCheck(user, "read", "Task", { userId: user.id }),
			).not.toThrow();
		});

		it("denies access to other resources", () => {
			expect(() =>
				accessCheck(user, "read", "Task", { userId: "other_id" }),
			).toThrow(NotAuthorizedError);
		});

		it("denies access to admin actions", () => {
			expect(() => accessCheck(user, "manage", "all")).toThrow(
				NotAuthorizedError,
			);
		});
	});

	describe("when user is an admin", () => {
		it("allows access to any resource", () => {
			expect(() =>
				accessCheck(admin, "read", "Task", { userId: "any_id" }),
			).not.toThrow();
		});

		it("allows admin actions", () => {
			expect(() => accessCheck(admin, "manage", "all")).not.toThrow();
		});
	});

	describe("when user is undefined", () => {
		it("denies access to any resource", () => {
			expect(() =>
				accessCheck(undefined, "read", "Task", { userId: "any_id" }),
			).toThrow(NotAuthorizedError);
		});

		it("denies admin actions", () => {
			expect(() => accessCheck(undefined, "manage", "all")).toThrow(
				NotAuthorizedError,
			);
		});
	});
});
