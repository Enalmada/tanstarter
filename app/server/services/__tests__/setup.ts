import { vi } from "vitest";

// Mock environment variables
vi.mock("~/env", () => ({
	default: {
		DATABASE_URL: "test-db-url",
		DATABASE_AUTH_TOKEN: "test-token",
	},
	buildEnv: {
		isDev: false,
		isProd: true,
	},
}));

// Mock the database module
vi.mock("../db", () => ({
	default: {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					execute: vi.fn().mockResolvedValue([]),
				}),
				execute: vi.fn().mockResolvedValue([]),
				orderBy: vi.fn().mockReturnValue({
					execute: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
		insert: vi.fn().mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockReturnValue({
					execute: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
		update: vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockReturnValue({
						execute: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		}),
		delete: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockReturnValue({
					execute: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
	},
}));
