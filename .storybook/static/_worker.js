export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Handle root requests
		if (url.pathname === "/") {
			return env.ASSETS.fetch(request);
		}

		// Handle Storybook specific paths
		if (url.pathname.includes("/sb-")) {
			// Remove any duplicate sb-addons paths
			const cleanPath = url.pathname
				.replace(/\/sb-addons\/.*?\/sb-addons\//g, "/sb-addons/")
				.replace(/\/sb-preview\/.*?\/sb-preview\//g, "/sb-preview/");

			if (cleanPath !== url.pathname) {
				return Response.redirect(new URL(cleanPath, request.url), 307);
			}
		}

		try {
			// Try to serve the exact file
			const response = await env.ASSETS.fetch(request);
			if (response.status === 200) return response;

			// If not found and it's not a file with extension, serve index.html
			if (response.status === 404 && !url.pathname.includes(".")) {
				return env.ASSETS.fetch("index.html");
			}

			return response;
		} catch {
			return new Response("Not Found", { status: 404 });
		}
	},
};
