import { vi } from "vitest";

type ServerFnHandler = <TInput, TOutput>(
	fn: (input: TInput) => Promise<TOutput>,
) => (input: TInput) => Promise<TOutput>;

export function createServerFn({ method }: { method: string }) {
	return {
		handler: ((fn) => {
			const mockFn = vi.fn(fn);
			return mockFn;
		}) as ServerFnHandler,
	};
}

// Mock the entire module
vi.mock("@tanstack/start", () => ({
	createServerFn: vi.fn().mockImplementation(({ method }) => ({
		handler: vi.fn().mockImplementation((fn) => {
			const mockFn = vi.fn(fn);
			return mockFn;
		}),
	})),
}));
