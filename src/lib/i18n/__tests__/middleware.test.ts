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

	it("varies HTML on the inputs that choose the locale", async () => {
		const next = vi.fn(async () => ({
			response: new Response("<html>", { headers: { "content-type": "text/html; charset=utf-8" } }),
		}));
		const { response } = await handler({ request: new Request("https://app.test/"), next, handlerType: "router" });
		expect(response.headers.get("vary")).toBe("Cookie, Accept-Language");
		expect(response.headers.get("cache-control")).toBeNull();
	});

	it("keeps a response that sets the cookie out of shared caches", async () => {
		const next = vi.fn(async () => ({
			response: new Response("<html>", { headers: { "content-type": "text/html" } }),
		}));
		const { response } = await handler({
			request: new Request("https://app.test/?locale=es"),
			next,
			handlerType: "router",
		});
		expect(response.headers.get("cache-control")).toBe("private, no-store");
		expect(response.headers.get("set-cookie")).toMatch(/^locale=es;/);
	});

	it("does not touch non-document responses", async () => {
		const next = vi.fn(async () => ({
			response: new Response("{}", { headers: { "content-type": "application/json", "cache-control": "max-age=60" } }),
		}));
		const { response } = await handler({
			request: new Request("https://app.test/health?locale=es"),
			next,
			handlerType: "router",
		});
		expect(response.headers.get("set-cookie")).toBeNull();
		expect(response.headers.get("vary")).toBeNull();
		expect(response.headers.get("cache-control")).toBe("max-age=60");
	});

	it("leaves server functions alone", async () => {
		const { next, contexts, result } = run({ "accept-language": "es" }, "https://app.test/", "serverFn");
		await result;
		expect(next).toHaveBeenCalledWith();
		expect(contexts).toEqual([]);
	});
});
