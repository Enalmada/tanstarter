import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("utils", () => {
	describe("cn", () => {
		it("should merge class names", () => {
			expect(cn("foo", "bar")).toBe("foo bar");
		});

		it("should handle conditional classes", () => {
			expect(cn("foo", undefined, "bar", null, false, "baz")).toBe(
				"foo bar baz",
			);
		});

		it("should handle arrays of classes", () => {
			expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
		});

		it("should merge Tailwind classes correctly", () => {
			expect(cn("p-4 bg-red-500", "p-6")).toBe("bg-red-500 p-6");
			expect(cn("text-sm text-gray-500", "text-lg")).toBe(
				"text-gray-500 text-lg",
			);
		});

		it("should handle complex combinations", () => {
			const result = cn(
				"base-class",
				{
					"conditional-true": true,
					"conditional-false": false,
				},
				["array-class-1", "array-class-2"],
				undefined,
				null,
			);
			expect(result).toBe(
				"base-class conditional-true array-class-1 array-class-2",
			);
		});
	});
});
