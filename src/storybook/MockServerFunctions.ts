/**
 * Mock server functions for Storybook testing
 * Prevents server-side imports from being resolved in browser environment
 */

// Mock server-side request functions
export const getRequest = () => null;
export const setResponseStatus = (_code: number) => {};
export const setResponseHeader = (_name: string, _value: string | string[]) => {};

// biome-ignore lint/suspicious/noExplicitAny: Mock createStartHandler needs flexible typing for compatibility
export const createStartHandler = (_options?: any) => {
	// Return a mock handler function
	// biome-ignore lint/suspicious/noExplicitAny: Mock handler needs flexible typing
	return async (_event: any) => {
		return new Response("Storybook mock", { status: 200 });
	};
};

// biome-ignore lint/suspicious/noExplicitAny: Mock defaultStreamHandler needs flexible typing for compatibility
export const defaultStreamHandler = async (_ctx: any) => {
	return new Response("Storybook mock stream", { status: 200 });
};

// Mock session functions
export const getSessionUser = () => Promise.resolve(null);

// Mock base-service functions
// biome-ignore lint/suspicious/noExplicitAny: Mock server function needs flexible typing for compatibility
export const findFirst = (_data: any) => Promise.resolve(null);

// biome-ignore lint/suspicious/noExplicitAny: Mock server function needs flexible typing for compatibility
export const findMany = (_data: any) => Promise.resolve([]);

export const createEntity = ({
	data,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: Mock server function needs flexible typing for compatibility
	data: { subject: string; data: any };
}) =>
	Promise.resolve({
		id: `mock-${Date.now()}`,
		...data.data,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

export const updateEntity = ({
	data,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: Mock server function needs flexible typing for compatibility
	data: { id: string; subject: string; data: any };
}) =>
	Promise.resolve({
		id: data.id,
		...data.data,
		updatedAt: new Date(),
	});

export const deleteEntity = ({ data }: { data: { id: string; subject: string } }) =>
	Promise.resolve({ id: data.id, success: true });

// Export default for any default imports
export default {
	getSessionUser,
	findFirst,
	findMany,
	createEntity,
	updateEntity,
	deleteEntity,
};
