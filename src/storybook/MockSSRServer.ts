/**
 * Minimal mock for @tanstack/react-start server modules
 * Prevents SSR module loading in Storybook browser environment
 */

// biome-ignore lint/suspicious/noExplicitAny: Mock server components need flexible typing for compatibility
export const StartServer = (_props: any) => null;

// biome-ignore lint/suspicious/noExplicitAny: Mock SSR functions need flexible typing for compatibility
export const createHandler = (_config: any) => () => null;

// biome-ignore lint/suspicious/noExplicitAny: Mock render functions need flexible typing for compatibility
export const renderRouterToString = (_props: any) => Promise.resolve("");

// biome-ignore lint/suspicious/noExplicitAny: Mock stream functions need flexible typing for compatibility
export const renderRouterToStream = (_props: any) => Promise.resolve(null);

// Mock server-only functions used by server functions
// biome-ignore lint/suspicious/noExplicitAny: Mock server function needs flexible typing for compatibility
export const getRequest = () => ({}) as any;

export const setResponseStatus = (_code: number) => {};

export default {
	StartServer,
	createHandler,
	renderRouterToString,
	renderRouterToStream,
	getRequest,
	setResponseStatus,
};
