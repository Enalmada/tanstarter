import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskStatus } from "~/server/db/schema";
import { TaskStatusBadge } from "../tasks/TaskStatusBadge";

describe("TaskStatusBadge", () => {
	it("should render active status", () => {
		render(<TaskStatusBadge status={TaskStatus.ACTIVE} />, {});

		const badge = screen.getByText("Active");
		expect(badge).toBeInTheDocument();
		expect(badge.closest('[data-test-color="blue"]')).toBeInTheDocument();
	});

	it("should render completed status", () => {
		render(<TaskStatusBadge status={TaskStatus.COMPLETED} />, {});

		const badge = screen.getByText("Completed");
		expect(badge).toBeInTheDocument();
		expect(badge.closest('[data-test-color="green"]')).toBeInTheDocument();
	});

	it("should handle unknown status", () => {
		render(
			<TaskStatusBadge
				status={"UNKNOWN" as (typeof TaskStatus)[keyof typeof TaskStatus]}
			/>,
			{},
		);

		const badge = screen.getByText("Unknown");
		expect(badge).toBeInTheDocument();
		expect(badge.closest('[data-test-color="gray"]')).toBeInTheDocument();
	});
});
