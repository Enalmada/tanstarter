import { describe, expect, it, vi } from "vitest";
import { getAuthenticatedUser, validateId } from "../base-service";

// Mock the auth module
vi.mock("~/server/auth/auth", () => ({
	getAuthSession: vi.fn(),
}));

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
		it("should return user when authenticated", async () => {
			const mockUser = {
				id: "123",
				email: "test@example.com",
				name: null,
				avatar_url: null,
				setup_at: null,
			};
			// Setup mock
			const { getAuthSession } = await import("~/server/auth/auth");
			vi.mocked(getAuthSession).mockResolvedValue({
				session: {
					id: "session-123",
					user_id: mockUser.id,
					expires_at: new Date(),
				},
				user: mockUser,
			});

			const result = await getAuthenticatedUser();
			expect(result).toEqual(mockUser);
		});

		it("should throw error when not authenticated", async () => {
			// Setup mock
			const { getAuthSession } = await import("~/server/auth/auth");
			vi.mocked(getAuthSession).mockResolvedValue({
				session: null,
				user: null,
			});

			await expect(getAuthenticatedUser()).rejects.toThrow("Unauthorized");
		});
	});
});
