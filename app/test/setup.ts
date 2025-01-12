import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock virtual:serwist
vi.mock("virtual:serwist", () => ({
	getSerwist: () => ({
		register: vi.fn(),
		unregister: vi.fn(),
	}),
}));

// Mock server functions
vi.mock("@tanstack/start", () => ({
	createServerFn: vi.fn().mockImplementation(({ method }) => {
		const serverFn = {
			handler: vi.fn().mockImplementation((fn) => {
				const mockFn = vi.fn(fn);
				return mockFn;
			}),
			validator: vi.fn().mockImplementation((validator) => serverFn),
		};
		return serverFn;
	}),
}));

// Clean up after each test
afterEach(() => {
	cleanup();
});
