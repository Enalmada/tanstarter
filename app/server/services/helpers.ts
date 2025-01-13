import type { User } from "../db/schema";

import { type StringSchema, object, safeParse, string } from "valibot";
import { getAuthSession } from "~/server/auth/auth";

export const idSchema = object({
	id: string("ID is required") as StringSchema<string>,
});

export function validateId(input: unknown): string {
	if (!input || typeof input !== "object") {
		throw new Error("Invalid ID");
	}

	if (!("id" in input)) {
		throw new Error("Invalid ID");
	}

	if (typeof input.id !== "string") {
		throw new Error("Invalid ID");
	}

	if (input.id.length === 0) {
		throw new Error("ID cannot be empty");
	}

	const result = safeParse(idSchema, input);
	if (!result.success) {
		const errorMessage = result.issues[0]?.message;
		throw new Error(errorMessage || "Invalid ID");
	}
	return result.output.id;
}

// Helper function to get authenticated user
export async function getAuthenticatedUser(): Promise<User> {
	const { user } = await getAuthSession();
	if (!user) {
		throw new Error("Unauthorized");
	}
	return user as User;
}
