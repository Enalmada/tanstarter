/**
 * Reusable form component for creating and editing tasks
 * Handles validation via valibot schema and manages form state with TanStack Form
 * Supports both create and edit modes through defaultValues prop
 */

import { Button, Checkbox, Input, Textarea } from "@nextui-org/react";
import { useForm } from "@tanstack/react-form";
import type { FieldApi } from "@tanstack/react-form";
import { useState } from "react";
import { ValiError, parse } from "valibot";
import type { Task, TaskStatusType } from "~/server/db/schema";
import { TaskStatus, taskFormSchema } from "~/server/db/schema";

type TaskFormData = {
	title: string;
	description: string | null;
	due_date: Date | null;
	status: TaskStatusType;
};

type FormFields = {
	title: string;
	description: string | null;
	due_date: string | null;
	completed: boolean;
};

interface TaskFormProps {
	defaultValues?: Partial<Task>;
	onSubmit: (values: TaskFormData) => void;
	isSubmitting?: boolean;
}

export function TaskForm({
	defaultValues,
	onSubmit,
	isSubmitting,
}: TaskFormProps) {
	const [formError, setFormError] = useState<string | null>(null);

	const form = useForm<FormFields>({
		defaultValues: {
			title: defaultValues?.title ?? "",
			description: defaultValues?.description ?? null,
			due_date: defaultValues?.due_date
				? new Date(defaultValues.due_date).toISOString().slice(0, 16)
				: null,
			completed: defaultValues?.status === TaskStatus.COMPLETED,
		},
		onSubmit: async ({ value }) => {
			try {
				setFormError(null);

				// Convert the form data to match the schema
				const formData = {
					title: value.title.trim(),
					description: value.description,
					due_date: value.due_date ? new Date(value.due_date) : null,
					status: value.completed ? TaskStatus.COMPLETED : TaskStatus.ACTIVE,
				};

				// Validate against the schema
				const validated = parse(taskFormSchema, formData);
				const status = validated.status as TaskStatusType;

				await onSubmit({
					title: validated.title,
					description: validated.description ?? null,
					due_date: validated.due_date ?? null,
					status,
				});
			} catch (error) {
				let errorMessage = "An unexpected error occurred";
				if (error instanceof ValiError) {
					errorMessage = error.issues
						.map((issue) => {
							const path = issue.path?.[0]?.key;
							return path ? `${path}: ${issue.message}` : issue.message;
						})
						.join(", ");
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}
				setFormError(errorMessage);
				throw error;
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
			className="flex flex-col gap-4"
		>
			<form.Field
				name="title"
				validators={{
					onChange: ({ value }) => {
						try {
							parse(taskFormSchema, {
								title: value,
								description: null,
								due_date: null,
								status: TaskStatus.ACTIVE,
							});
						} catch (error) {
							if (error instanceof ValiError) {
								const titleError = error.issues.find(
									(issue) => issue.path?.[0]?.key === "title",
								);
								if (titleError) {
									return titleError.message;
								}
							}
							return "Title is invalid";
						}
					},
				}}
			>
				{(field) => (
					<div>
						<Input
							label="Title"
							value={field.state.value}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
							isInvalid={field.state.meta.errors.length > 0}
							errorMessage={field.state.meta.errors.join(", ")}
							isRequired
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<div>
						<Textarea
							label="Description"
							value={field.state.value ?? ""}
							onValueChange={(value) => field.handleChange(value || null)}
							onBlur={field.handleBlur}
							isInvalid={field.state.meta.errors.length > 0}
							errorMessage={field.state.meta.errors.join(", ")}
							minRows={3}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="due_date">
				{(field) => (
					<div>
						<Input
							type="datetime-local"
							label="Due Date"
							placeholder="Select a date and time"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
							isInvalid={field.state.meta.errors.length > 0}
							errorMessage={field.state.meta.errors.join(", ")}
							classNames={{
								input: "px-3 py-2",
								inputWrapper: "h-auto min-h-unit-10",
							}}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="completed">
				{(field) => (
					<div>
						<Checkbox
							isSelected={field.state.value}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						>
							Completed
						</Checkbox>
					</div>
				)}
			</form.Field>

			{formError && (
				<div className="rounded-medium bg-danger-50 p-3 text-danger text-sm">
					{formError}
				</div>
			)}

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
			>
				{([canSubmit, submitting]) => (
					<Button
						type="submit"
						color="primary"
						isLoading={isSubmitting || submitting}
						isDisabled={!canSubmit}
						className="self-end"
					>
						Save Task
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
