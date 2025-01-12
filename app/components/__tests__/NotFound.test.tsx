import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TestWrapper } from "~/test/TestWrapper";
import { NotFound } from "../NotFound";

// Mock router hooks
vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
		<a href={to}>{children}</a>
	),
}));

describe("NotFound", () => {
	it("should render not found message", () => {
		render(<NotFound />, { wrapper: TestWrapper });

		// Check for not found message
		expect(
			screen.getByText("The page you are looking for does not exist."),
		).toBeInTheDocument();

		// Check for navigation buttons
		expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
			"href",
			"/",
		);
	});
});
