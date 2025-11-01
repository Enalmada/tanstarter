import type { Meta, StoryObj } from "@storybook/react";
import type { Task } from "~/server/db/schema";
import { TaskStatus } from "~/server/db/schema";
import { AdminTaskForm } from "./TaskForm";

const meta = {
	title: "Admin/TaskForm",
	component: AdminTaskForm,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	args: {
		onSubmit: (values) => {
			// biome-ignore lint/suspicious/noConsole: Storybook action
			console.log("Form submitted:", values);
			alert(`Task submitted: ${values.title}`);
		},
		isSubmitting: false,
	},
} satisfies Meta<typeof AdminTaskForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const CreateTask: Story = {
	args: {},
};

export const EditTask: Story = {
	args: {
		defaultValues: {
			id: "task_123",
			title: "Sample Task",
			description: "This is a sample task description",
			dueDate: new Date("2025-12-31"),
			status: TaskStatus.ACTIVE,
			userId: "user_123",
			version: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as Task,
	},
};

export const CompletedTask: Story = {
	args: {
		defaultValues: {
			id: "task_456",
			title: "Completed Task",
			description: "This task has been completed",
			dueDate: new Date("2025-01-15"),
			status: TaskStatus.COMPLETED,
			userId: "user_456",
			version: 2,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as Task,
	},
};

export const Submitting: Story = {
	args: {
		isSubmitting: true,
		defaultValues: {
			id: "task_789",
			title: "Task being saved",
			description: "This task is currently being submitted",
			dueDate: new Date("2025-02-01"),
			status: TaskStatus.ACTIVE,
			userId: "user_789",
			version: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as Task,
	},
};
