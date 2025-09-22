/**
 * Mock server functions for Storybook testing
 * Prevents server-side imports from being resolved in browser environment
 */

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
