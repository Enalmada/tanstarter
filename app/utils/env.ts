/**
 * Helper function to determine if code is running on client side
 * Uses getWebRequest from vinxi to check for server context
 */
export function isClient() {
	return typeof window !== "undefined";
}
