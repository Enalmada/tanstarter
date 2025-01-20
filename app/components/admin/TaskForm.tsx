import type { Task, TaskStatusType } from "~/server/db/schema";
import { TaskStatus, taskFormSchema } from "~/server/db/schema";
import { FormGenerator } from "../form/FormGenerator";
import type { FormFieldConfig } from "../form/types";

export type TaskFormData = {
	title: string;
	description: string | null;
	dueDate: Date | null;
	status: TaskStatusType;
	userId: string;
	version: number | null;
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
	const fields: FormFieldConfig<TaskFormData>[] = [
		{
			key: "version",
			type: "hidden",
		},
		{
			key: "title",
			type: "text",
			label: "Title",
			placeholder: "Enter task title",
			required: true,
		},
		{
			key: "description",
			type: "textarea",
			label: "Description",
			placeholder: "Enter task description",
		},
		{
			key: "dueDate",
			type: "date",
			label: "Due Date",
		},
		{
			key: "status",
			type: "select",
			label: "Status",
			options: [
				{ value: TaskStatus.ACTIVE, label: "Active" },
				{ value: TaskStatus.COMPLETED, label: "Completed" },
			],
		},
		{
			key: "userId",
			type: "text",
			label: "User ID",
			placeholder: "Enter user ID",
			required: true,
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
				userId: defaultValues?.userId ?? "",
				version: defaultValues?.version ?? 1,
			}}
			onSubmit={onSubmit}
			isSubmitting={isSubmitting}
			schema={taskFormSchema}
		/>
	);
}
