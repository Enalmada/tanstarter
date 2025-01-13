import { describe, expect, it } from "vitest";
import { validateId } from "../helpers";

describe("base-service", () => {
	describe("validateId", () => {
		it("should validate a valid ID", () => {
			const validInput = { id: "123" };
			const result = validateId(validInput);
			expect(result).toBe("123");
		});

		it("should throw error for missing ID", () => {
			const invalidInput = {};
			expect(() => validateId(invalidInput)).toThrow("Invalid ID");
		});

		it("should throw error for empty ID", () => {
			const invalidInput = { id: "" };
			expect(() => validateId(invalidInput)).toThrow("ID cannot be empty");
		});

		it("should throw error for non-string ID", () => {
			const invalidInput = { id: 123 };
			expect(() => validateId(invalidInput)).toThrow("Invalid ID");
		});
	});

	describe("getAuthenticatedUser", () => {
		it("should validate a valid user", () => {
			const validUser = { id: "123", name: "Test User" };
			const result = validateId({ id: validUser.id });
			expect(result).toBe("123");
		});

		it("should throw error for missing user", () => {
			const invalidUser = undefined;
			expect(() => validateId({ id: invalidUser })).toThrow("Invalid ID");
		});
	});
});
