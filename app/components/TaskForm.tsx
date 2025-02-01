import { date, minLength, nullish, picklist, pipe, string } from "valibot";
import type { Task } from "~/server/db/schema";
import { TaskStatus } from "~/server/db/schema";
import { FormGenerator } from "./form/FormGenerator";
import type { FormFieldConfig } from "./form/types";

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
	const fields: FormFieldConfig<TaskFormData>[] = [
		{
			key: "version",
			type: "hidden",
			disabled: true,
		},
		{
			key: "userId",
			type: "hidden",
			disabled: true,
			validation: pipe(string(), minLength(1, "User ID is required")),
		},
		{
			key: "title",
			type: "text",
			label: "Title",
			placeholder: "Enter task title",
			required: true,
			disabled: false,
			validation: pipe(string(), minLength(1, "Title is required")),
		},
		{
			key: "description",
			type: "textarea",
			label: "Description",
			placeholder: "Enter task description",
			disabled: false,
			validation: nullish(string()),
		},
		{
			key: "dueDate",
			type: "date",
			label: "Due Date",
			disabled: false,
			validation: nullish(date()),
		},
		{
			key: "status",
			type: "checkbox",
			label: "Completed",
			disabled: false,
			validation: picklist([TaskStatus.ACTIVE, TaskStatus.COMPLETED]),
			transform: {
				input: (value: unknown) => {
					// If it's already a boolean, use it directly
					if (typeof value === "boolean") {
						return value;
					}
					// If it's a string (TaskStatus), check if it's COMPLETED
					if (typeof value === "string") {
						return value === TaskStatus.COMPLETED;
					}
					// For any other case (including null/undefined), default to false
					return false;
				},
				output: (checked: boolean) => {
					return checked ? TaskStatus.COMPLETED : TaskStatus.ACTIVE;
				},
			},
		},
	];

	return (
		<FormGenerator<TaskFormData>
			fields={fields}
			defaultValues={{
				title: defaultValues?.title ?? "",
				description: defaultValues?.description ?? null,
				dueDate: defaultValues?.dueDate
					? new Date(defaultValues.dueDate)
					: null,
				status: defaultValues?.status ?? TaskStatus.ACTIVE,
				userId: defaultValues?.userId ?? userId,
				version: defaultValues ? defaultValues.version : 1,
			}}
			onSubmit={onSubmit}
			isSubmitting={isSubmitting}
			submitText={defaultValues ? "Update Task" : "Create Task"}
		/>
	);
}
