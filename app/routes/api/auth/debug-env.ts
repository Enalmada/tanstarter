"use server";

import { createAPIFileRoute } from "@tanstack/start/api";

export const APIRoute = createAPIFileRoute("/api/auth/debug-env")({
	GET: async ({ request }) => {
		const debugInfo = {
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,

			// Check global __env__
			globalEnv: {
				exists: typeof (globalThis as any).__env__ !== "undefined",
				type: typeof (globalThis as any).__env__,
				keys: (globalThis as any).__env__
					? Object.keys((globalThis as any).__env__)
					: null,
				hasClientId: !!(globalThis as any).__env__?.GOOGLE_CLIENT_ID,
				available: (globalThis as any).__env__?.GOOGLE_CLIENT_ID || null,
			},

			// Check Cloudflare global
			cloudflare: {
				exists: typeof (globalThis as any).Cloudflare !== "undefined",
				type: typeof (globalThis as any).Cloudflare,
				keys: (globalThis as any).Cloudflare
					? Object.keys((globalThis as any).Cloudflare)
					: null,
				hasEnv: !!(globalThis as any).Cloudflare?.env,
				envKeys: (globalThis as any).Cloudflare?.env
					? Object.keys((globalThis as any).Cloudflare.env)
					: null,
			},

			// Check _importMeta_
			importMeta: {
				exists: typeof (globalThis as any)._importMeta_ !== "undefined",
				type: typeof (globalThis as any)._importMeta_,
				keys: (globalThis as any)._importMeta_
					? Object.keys((globalThis as any)._importMeta_)
					: null,
				hasEnv: !!(globalThis as any)._importMeta_?.env,
				envKeys: (globalThis as any)._importMeta_?.env
					? Object.keys((globalThis as any)._importMeta_.env)
					: null,
			},

			// Try to access env through various global paths
			envPaths: {
				"__env__.GOOGLE_CLIENT_ID": !!(globalThis as any).__env__
					?.GOOGLE_CLIENT_ID,
				"Cloudflare.env.GOOGLE_CLIENT_ID": !!(globalThis as any).Cloudflare?.env
					?.GOOGLE_CLIENT_ID,
				"_importMeta_.env.GOOGLE_CLIENT_ID": !!(globalThis as any)._importMeta_
					?.env?.GOOGLE_CLIENT_ID,
			},

			// Basic request info
			request: {
				url: request.url,
				method: request.method,
			},
		};

		return Response.json(debugInfo, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	},
});
