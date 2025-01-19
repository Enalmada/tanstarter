import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskStatus } from "~/server/db/schema";
import { mockUserId } from "~/server/services/__tests__/base-service.test";
import { TestWrapper } from "~/test/TestWrapper";
import { TaskForm } from "../TaskForm";

describe("TaskForm", () => {
	it("should render empty form", () => {
		render(<TaskForm userId={mockUserId} onSubmit={() => {}} />, {
			wrapper: TestWrapper,
		});

		// Check for form fields
		expect(screen.getByRole("textbox", { name: "Title" })).toBeInTheDocument();
		expect(
			screen.getByRole("textbox", { name: "Description" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("checkbox", { name: "Completed" }),
		).toBeInTheDocument();

		// Check for submit button
		expect(
			screen.getByRole("button", { name: "Create Task" }),
		).toBeInTheDocument();
	});

	it("should render form with default values", () => {
		const defaultValues = {
			title: "Test Task",
			description: "Test Description",
			dueDate: new Date("2024-03-20"),
			status: TaskStatus.ACTIVE,
			version: 1,
		};

		render(
			<TaskForm
				userId={mockUserId}
				defaultValues={defaultValues}
				onSubmit={() => {}}
			/>,
			{
				wrapper: TestWrapper,
			},
		);

		// Check field values
		expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue(
			defaultValues.title,
		);
		expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
			defaultValues.description,
		);
		expect(
			screen.getByRole("checkbox", { name: "Completed" }),
		).not.toBeChecked();

		// Check for submit button
		expect(
			screen.getByRole("button", { name: "Update Task" }),
		).toBeInTheDocument();
	});

	it("should handle form submission", async () => {
		const onSubmit = vi.fn();
		render(<TaskForm userId={mockUserId} onSubmit={onSubmit} />, {
			wrapper: TestWrapper,
		});

		// Fill out form
		await act(async () => {
			fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
				target: { value: "New Task" },
			});
			fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
				target: { value: "New Description" },
			});
			fireEvent.click(screen.getByRole("checkbox", { name: "Completed" }));
		});

		// Submit form
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
		});

		// Wait for form submission
		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith({
				title: "New Task",
				description: "New Description",
				status: TaskStatus.COMPLETED,
				dueDate: null,
				userId: mockUserId,
				version: 1,
			});
		});
	});

	it("should show loading state", () => {
		render(<TaskForm userId={mockUserId} onSubmit={() => {}} isSubmitting />, {
			wrapper: TestWrapper,
		});

		// Check if submit button is disabled and shows loading state
		const submitButton = screen.getByRole("button", { name: "Create Task" });
		expect(submitButton).toBeDisabled();
	});

	it("should validate required fields", async () => {
		const onSubmit = vi.fn();
		render(<TaskForm userId={mockUserId} onSubmit={onSubmit} />, {
			wrapper: TestWrapper,
		});

		// Get the title input
		const titleInput = screen.getByRole("textbox", { name: "Title" });

		// Submit empty form
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
		});

		// Trigger validation by changing the value and then clearing it
		await act(async () => {
			fireEvent.change(titleInput, { target: { value: "test" } });
			fireEvent.change(titleInput, { target: { value: "" } });
		});

		// Wait for validation error
		await waitFor(() => {
			expect(titleInput).toHaveAttribute("data-error", "Title is required");
		});

		// Check that onSubmit was not called
		expect(onSubmit).not.toHaveBeenCalled();

		// Try to submit again to ensure validation persists
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
		});

		// Check error is still there
		expect(titleInput).toHaveAttribute("data-error", "Title is required");
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
