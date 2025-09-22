/**
 * Minimal mock for @tanstack/react-start modules
 * Prevents server function calls in Storybook environment
 */

// biome-ignore lint/suspicious/noExplicitAny: Mock createServerFn needs flexible function typing for compatibility
export const createServerFn = (_options?: any) => {
	return {
		// biome-ignore lint/suspicious/noExplicitAny: Mock handler needs flexible typing for compatibility
		handler: (fn: any) => fn,
		// biome-ignore lint/suspicious/noExplicitAny: Mock validator needs flexible typing for compatibility
		validator: (fn: any) => ({ handler: fn }),
	};
};

// biome-ignore lint/suspicious/noExplicitAny: Mock StartClient component needs flexible props typing
export const StartClient = ({ children, ..._props }: any) => {
	// Just render children in Storybook environment
	return children;
};

// biome-ignore lint/suspicious/noExplicitAny: Mock useServerFn hook needs flexible typing for compatibility
export const useServerFn = (_serverFn: any) => {
	// Return a mock function that resolves with mock data
	// biome-ignore lint/suspicious/noExplicitAny: Mock function args need flexible typing
	return async (..._args: any[]) => {
		// Return a basic mock response structure
		return {
			id: "mock-id",
			title: "Mock Discussion",
			description: "Mock description for storybook",
			author: { name: "Mock Author", id: "mock-author-id" },
		};
	};
};

// Mock other exports that might be imported
export default {
	createServerFn,
	StartClient,
	useServerFn,
};
