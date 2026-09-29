/**
 * Pathname of a request URL for exception properties. Never the query string
 * or fragment: they can carry tokens or personal data.
 */
export function requestPath(url: string): string | null {
	try {
		return new URL(url).pathname;
	} catch {
		return null;
	}
}
