import { Button, Select, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { ValiError, parse } from "valibot";
import type { Task, TaskStatusType } from "~/server/db/schema";
import { TaskStatus, taskFormSchema } from "~/server/db/schema";

type FormFields = {
	title: string;
	description: string | null;
	due_date: string | null;
	status: TaskStatusType;
};

export type TaskFormData = {
	title: string;
	description: string | null;
	due_date: Date | null;
	status: TaskStatusType;
};

interface AdminTaskFormProps {
	defaultValues?: Partial<Task>;
	onSubmit: (values: TaskFormData) => void;
	isSubmitting?: boolean;
}

export function AdminTaskForm({
	defaultValues,
	onSubmit,
	isSubmitting = false,
}: AdminTaskFormProps) {
	const [error, setError] = useState<string | null>(null);

	const form = useForm<FormFields>({
		defaultValues: {
			title: defaultValues?.title ?? "",
			description: defaultValues?.description ?? null,
			due_date: defaultValues?.due_date
				? new Date(defaultValues.due_date).toISOString().split("T")[0]
				: null,
			status: defaultValues?.status ?? TaskStatus.ACTIVE,
		},
		onSubmit: async ({ value }) => {
			try {
				const formData = {
					title: value.title,
					description: value.description,
					due_date: value.due_date ? new Date(value.due_date) : null,
					status: value.status,
				} satisfies TaskFormData;

				const result = parse(taskFormSchema, formData);
				onSubmit(formData);
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
				<form.Field
					name="title"
					validators={{
						onChange: ({ value }) => {
							if (!value) return "Title is required";
							if (value.length < 3)
								return "Title must be at least 3 characters";
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

				<form.Field name="due_date">
					{(field) => (
						<TextInput
							type="date"
							value={field.state.value ?? ""}
							onChange={(e) => field.handleChange(e.target.value || null)}
							onBlur={field.handleBlur}
							label="Due Date"
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.Field>

				<form.Field name="status">
					{(field) => (
						<Select
							value={field.state.value}
							onChange={(value) => field.handleChange(value as TaskStatusType)}
							onBlur={field.handleBlur}
							label="Status"
							data={[
								{ value: TaskStatus.ACTIVE, label: "Active" },
								{ value: TaskStatus.COMPLETED, label: "Completed" },
							]}
							error={field.state.meta.errors[0]}
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
