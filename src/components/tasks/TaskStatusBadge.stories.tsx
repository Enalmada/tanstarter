import type { Meta, StoryObj } from "@storybook/react";
import { TaskStatus } from "~/server/db/schema";
import { TaskStatusBadge } from "./TaskStatusBadge";

const meta = {
	title: "Components/TaskStatusBadge",
	component: TaskStatusBadge,
	tags: ["autodocs"],
	argTypes: {
		status: {
			control: "select",
			options: Object.values(TaskStatus),
			description: "The status of the task",
		},
	},
} satisfies Meta<typeof TaskStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		status: TaskStatus.ACTIVE,
	},
};

export const Active: Story = {
	args: {
		status: TaskStatus.ACTIVE,
	},
};

export const Completed: Story = {
	args: {
		status: TaskStatus.COMPLETED,
	},
};
