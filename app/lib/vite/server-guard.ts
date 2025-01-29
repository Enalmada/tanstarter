import type { Plugin } from "vite";

export function serverGuard(): Plugin {
	return {
		name: "server-guard",
		transform(code, id) {
			// Only transform server-side code
			if (id.includes("/server/")) {
				// Wrap the module in a check that throws if imported on client
				return {
					code: `
if (typeof window !== 'undefined') {
	throw new Error('Server-side code cannot be imported on the client: ' + '${id}');
}
${code}
`,
					map: null,
				};
			}
		},
	};
}
