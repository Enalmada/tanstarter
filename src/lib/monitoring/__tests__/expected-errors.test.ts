import { notFound, redirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { isExpectedError } from "~/lib/monitoring/expected-errors";
import { BadRequestError, ConflictError, NotAuthorizedError, NotFoundError } from "~/server/access/http-errors";

function withStatus(status: number) {
	return Object.assign(new Error("http"), { status });
}

function named(name: string) {
	const error = new Error("wire");
	error.name = name;
	return error;
}

describe("isExpectedError", () => {
	it("treats router redirects and not-founds as expected", () => {
		expect(isExpectedError(redirect({ to: "/" }))).toBe(true);
		expect(isExpectedError(notFound())).toBe(true);
	});

	it("treats 4xx domain errors as expected", () => {
		expect(isExpectedError(new BadRequestError("bad"))).toBe(true);
		expect(isExpectedError(new NotAuthorizedError("no"))).toBe(true);
		expect(isExpectedError(new NotFoundError("missing"))).toBe(true);
		expect(isExpectedError(new ConflictError("taken"))).toBe(true);
	});

	it("matches domain errors by name after authErrorTranslator sanitizes them", () => {
		expect(isExpectedError(named("NotFoundError"))).toBe(true);
		expect(isExpectedError(named("TypeError"))).toBe(false);
	});

	it("uses a numeric status only in the 4xx range", () => {
		expect(isExpectedError(withStatus(404))).toBe(true);
		expect(isExpectedError(withStatus(500))).toBe(false);
		expect(isExpectedError(withStatus(302))).toBe(false);
	});

	it("reports plain errors and non-errors", () => {
		expect(isExpectedError(new Error("boom"))).toBe(false);
		expect(isExpectedError("boom")).toBe(false);
		expect(isExpectedError(null)).toBe(false);
	});
});
