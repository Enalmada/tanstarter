import { describe, expect, it, vi } from "vitest";
import { i18nMiddleware } from "~/lib/i18n/middleware";

// src/test/setup.ts mocks createMiddleware(...).server(fn) to return fn
const handler = i18nMiddleware as unknown as (args: {
	request: Request;
	next: (options?: { context: { i18n: { locale: string } } }) => Promise<{ response: Response; ctx?: unknown }>;
	handlerType: "router" | "serverFn";
}) => Promise<{ response: Response }>;

function run(
	headers: Record<string, string>,
	url = "https://app.test/",
	handlerType: "router" | "serverFn" = "router",
) {
	const contexts: string[] = [];
	const next = vi.fn(async (options?: { context: { i18n: { locale: string } } }) => {
		if (options) contexts.push(options.context.i18n.locale);
		return { response: new Response("ok") };
	});
	return { next, contexts, result: handler({ request: new Request(url, { headers }), next, handlerType }) };
}

describe("i18nMiddleware", () => {
	it("gives each request its own activated instance", async () => {
		const a = run({ "accept-language": "es" });
		const b = run({ "accept-language": "en" });
		await Promise.all([a.result, b.result]);
		expect(a.contexts).toEqual(["es"]);
		expect(b.contexts).toEqual(["en"]);
	});

	it("sets no cookie for an inferred locale", async () => {
		const { result } = run({ "accept-language": "es" });
		expect((await result).response.headers.get("set-cookie")).toBeNull();
	});

	it("remembers an explicit ?locale= choice", async () => {
		const { result } = run({}, "https://app.test/?locale=es");
		expect((await result).response.headers.get("set-cookie")).toMatch(/^locale=es;/);
	});

	it("leaves server functions alone", async () => {
		const { next, contexts, result } = run({ "accept-language": "es" }, "https://app.test/", "serverFn");
		await result;
		expect(next).toHaveBeenCalledWith();
		expect(contexts).toEqual([]);
	});
});
