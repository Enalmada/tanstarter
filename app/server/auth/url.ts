export function getBaseUrl() {
	if (typeof window !== "undefined") {
		// Browser should use relative path
		return "";
	}

	if (process.env.NODE_ENV === "production") {
		return (
			process.env.CF_PAGES_URL ||
			process.env.SITE_URL ||
			"https://yourdomain.pages.dev"
		);
	}

	return "http://localhost:3000";
}

export function createFullUrl(path: string) {
	const baseUrl = getBaseUrl();
	return `${baseUrl}${path}`;
}
