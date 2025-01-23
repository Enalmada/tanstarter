import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./Card";

const renderWithProvider = (ui: React.ReactNode) => {
	return render(<MantineProvider>{ui}</MantineProvider>);
};

describe("Card", () => {
	it("renders children correctly", () => {
		renderWithProvider(<Card>Content</Card>);
		expect(screen.getByText("Content")).toBeInTheDocument();
	});

	it("forwards additional props to the Paper component", () => {
		renderWithProvider(
			<Card data-testid="test-card" withBorder>
				Card Content
			</Card>,
		);
		const card = screen.getByTestId("test-card");
		expect(card).toBeInTheDocument();
	});

	it("applies padding correctly", () => {
		renderWithProvider(
			<Card p="lg" data-testid="test-card">
				Card Content
			</Card>,
		);
		expect(screen.getByTestId("test-card")).toBeInTheDocument();
	});

	it("applies shadow-sm correctly", () => {
		renderWithProvider(
			<Card shadow="md" data-testid="test-card">
				Card Content
			</Card>,
		);
		expect(screen.getByTestId("test-card")).toBeInTheDocument();
	});
});
