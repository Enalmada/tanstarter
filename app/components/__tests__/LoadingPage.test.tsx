import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingPage } from "../LoadingPage";

describe("LoadingPage", () => {
	it("should render loading spinner", () => {
		render(<LoadingPage />);

		const loader = screen.getByRole("status");
		expect(loader).toBeInTheDocument();
	});
});
