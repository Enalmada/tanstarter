/**
 * Helper function to determine if code is running on client side
 */
export function isClient() {
	return typeof window !== "undefined";
}
