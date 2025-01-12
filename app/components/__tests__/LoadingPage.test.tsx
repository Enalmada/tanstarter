import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TestWrapper } from "~/test/TestWrapper";
import { LoadingPage } from "../LoadingPage";

describe("LoadingPage", () => {
	it("should render loading spinner", () => {
		render(<LoadingPage />, { wrapper: TestWrapper });

		const loader = screen.getByRole("progressbar");
		expect(loader).toBeInTheDocument();
	});
});
