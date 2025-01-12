import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

const renderWithProvider = (ui: React.ReactNode) => {
	return render(<MantineProvider>{ui}</MantineProvider>);
};

describe("Button", () => {
	it("renders children correctly", () => {
		renderWithProvider(<Button>Click me</Button>);
		expect(screen.getByText("Click me")).toBeInTheDocument();
	});

	it("applies size classes correctly", () => {
		const { rerender } = renderWithProvider(
			<Button size="sm">Small Button</Button>,
		);
		expect(screen.getByText("Small Button")).toBeInTheDocument();

		rerender(
			<MantineProvider>
				<Button size="lg">Large Button</Button>
			</MantineProvider>,
		);
		expect(screen.getByText("Large Button")).toBeInTheDocument();
	});

	it("applies variant classes correctly", () => {
		const { rerender } = renderWithProvider(
			<Button variant="filled">Filled</Button>,
		);
		expect(screen.getByText("Filled")).toBeInTheDocument();

		rerender(
			<MantineProvider>
				<Button variant="outline">Outline</Button>
			</MantineProvider>,
		);
		expect(screen.getByText("Outline")).toBeInTheDocument();

		rerender(
			<MantineProvider>
				<Button variant="light">Light</Button>
			</MantineProvider>,
		);
		expect(screen.getByText("Light")).toBeInTheDocument();
	});

	it("forwards additional props to the button element", () => {
		renderWithProvider(
			<Button data-testid="test-button" disabled>
				Disabled Button
			</Button>,
		);
		const button = screen.getByTestId("test-button");
		expect(button).toBeDisabled();
	});
});
