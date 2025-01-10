import { object, safeParse, string } from "valibot";
import { getAuthSession } from "~/server/auth/auth";

export const idSchema = object({
	id: string(),
});

export function validateId(input: unknown): string {
	const result = safeParse(idSchema, input);
	if (!result.success) {
		throw new Error("Invalid ID");
	}
	return result.output.id;
}

// Helper function to get authenticated user
export async function getAuthenticatedUser() {
	const { user } = await getAuthSession();
	if (!user) {
		throw new Error("Unauthorized");
	}
	return user;
}
