"use server";

import { createAPIFileRoute } from "@tanstack/start/api";

interface EnvObject {
	GOOGLE_CLIENT_ID?: string;
	[key: string]: string | undefined;
}

interface CloudflareEnv {
	env?: Record<string, unknown>;
}

interface ImportMeta {
	env?: Record<string, unknown>;
}

declare global {
	var __env__: Record<string, string> | undefined;
	var Cloudflare: CloudflareEnv | undefined;
	var _importMeta_: ImportMeta | undefined;
}

export const APIRoute = createAPIFileRoute("/api/auth/debug-env")({
	GET: async ({ request }) => {
		const debugInfo = {
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,

			// Check global __env__
			globalEnv: {
				exists: typeof globalThis.__env__ !== "undefined",
				type: typeof globalThis.__env__,
				keys: globalThis.__env__ ? Object.keys(globalThis.__env__) : null,
				hasClientId: !!globalThis.__env__?.GOOGLE_CLIENT_ID,
				available: globalThis.__env__?.GOOGLE_CLIENT_ID || null,
			},

			// Check Cloudflare global
			cloudflare: {
				exists: typeof globalThis.Cloudflare !== "undefined",
				type: typeof globalThis.Cloudflare,
				keys: globalThis.Cloudflare ? Object.keys(globalThis.Cloudflare) : null,
				hasEnv: !!globalThis.Cloudflare?.env,
				envKeys: globalThis.Cloudflare?.env
					? Object.keys(globalThis.Cloudflare.env)
					: null,
			},

			// Check _importMeta_
			importMeta: {
				exists: typeof globalThis._importMeta_ !== "undefined",
				type: typeof globalThis._importMeta_,
				keys: globalThis._importMeta_
					? Object.keys(globalThis._importMeta_)
					: null,
				hasEnv: !!globalThis._importMeta_?.env,
				envKeys: globalThis._importMeta_?.env
					? Object.keys(globalThis._importMeta_.env)
					: null,
			},

			// Try to access env through various global paths
			envPaths: {
				"__env__.GOOGLE_CLIENT_ID": !!globalThis.__env__?.GOOGLE_CLIENT_ID,
				"Cloudflare.env.GOOGLE_CLIENT_ID":
					!!globalThis.Cloudflare?.env?.GOOGLE_CLIENT_ID,
				"_importMeta_.env.GOOGLE_CLIENT_ID":
					!!globalThis._importMeta_?.env?.GOOGLE_CLIENT_ID,
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
