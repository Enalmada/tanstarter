/**
 * Reusable form component for creating and editing tasks
 * Handles validation via valibot schema and manages form state with TanStack Form
 * Supports both create and edit modes through defaultValues prop
 */

import { Button, Checkbox, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { ValiError, parse } from "valibot";
import type { Task } from "~/server/db/schema";
import { TaskStatus, taskFormSchema } from "~/server/db/schema";

// Single type for form data
export type TaskFormData = {
	title: string;
	description: string | null;
	dueDate: Date | null;
	status: (typeof TaskStatus)[keyof typeof TaskStatus];
	userId: string;
	version: number | undefined;
};

interface TaskFormProps {
	defaultValues?: Partial<Task>;
	onSubmit: (values: TaskFormData) => void;
	isSubmitting?: boolean;
	userId: string;
}

export function TaskForm({
	defaultValues,
	onSubmit,
	isSubmitting = false,
	userId,
}: TaskFormProps) {
	const [error, setError] = useState<string | null>(null);

	const form = useForm<TaskFormData>({
		defaultValues: {
			title: defaultValues?.title ?? "",
			description: defaultValues?.description ?? null,
			dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : null,
			status: defaultValues?.status ?? TaskStatus.ACTIVE,
			userId,
			version: defaultValues ? defaultValues.version : 1,
		},
		onSubmit: async ({ value }) => {
			try {
				// Pass the value directly - the schema will handle date conversion
				const result = parse(taskFormSchema, value);
				onSubmit({
					...result,
					description: result.description ?? null,
					dueDate: result.dueDate,
					userId,
					version: value.version,
				});
			} catch (err) {
				if (err instanceof ValiError) {
					setError(err.message);
				}
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<Stack gap="md">
				<form.Field name="version">
					{(field) => (
						<input
							type="hidden"
							value={field.state.value?.toString() ?? ""}
							onChange={(e) =>
								field.handleChange(
									e.target.value ? Number(e.target.value) : undefined,
								)
							}
						/>
					)}
				</form.Field>

				<form.Field
					name="title"
					validators={{
						onChange: ({ value }) => {
							if (!value) return "Title is required";
							return undefined;
						},
						onBlur: ({ value }) => {
							if (!value) return "Title is required";
							return undefined;
						},
						onSubmit: ({ value }) => {
							if (!value) return "Title is required";
							return undefined;
						},
					}}
				>
					{(field) => (
						<TextInput
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							label="Title"
							placeholder="Enter task title"
							required
							error={field.state.meta.errors[0]}
							data-error={field.state.meta.errors[0]}
							aria-invalid={!!field.state.meta.errors[0]}
						/>
					)}
				</form.Field>

				<form.Field name="description">
					{(field) => (
						<Textarea
							value={field.state.value ?? ""}
							onChange={(e) => field.handleChange(e.target.value || null)}
							onBlur={field.handleBlur}
							label="Description"
							placeholder="Enter task description"
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.Field>

				<form.Field name="dueDate">
					{(field) => (
						<TextInput
							type="date"
							value={field.state.value?.toISOString().split("T")[0] ?? ""}
							onChange={(e) =>
								field.handleChange(
									e.target.value ? new Date(e.target.value) : null,
								)
							}
							onBlur={field.handleBlur}
							label="Due Date"
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.Field>

				<form.Field name="status">
					{(field) => (
						<Checkbox
							checked={field.state.value === TaskStatus.COMPLETED}
							onChange={(e) =>
								field.handleChange(
									e.currentTarget.checked
										? TaskStatus.COMPLETED
										: TaskStatus.ACTIVE,
								)
							}
							onBlur={field.handleBlur}
							label="Completed"
						/>
					)}
				</form.Field>

				{error && <div className="text-red-500 text-sm">{error}</div>}

				<Button
					type="submit"
					loading={isSubmitting}
					disabled={isSubmitting || form.state.isSubmitting}
				>
					{defaultValues ? "Update Task" : "Create Task"}
				</Button>
			</Stack>
		</form>
	);
}
