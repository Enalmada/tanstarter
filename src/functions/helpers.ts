import { object, type StringSchema, safeParse, string } from "valibot";

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
