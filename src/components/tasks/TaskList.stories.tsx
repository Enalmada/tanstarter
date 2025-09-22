import type { Meta, StoryObj } from "@storybook/react";
import { TaskStatus } from "~/server/db/schema";
import { TaskList } from "./TaskList";

const meta: Meta<typeof TaskList> = {
	title: "Components/TaskList",
	component: TaskList,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		userId: "mock-user-id",
		tasks: [
			{
				id: "1",
				title: "Sample Task",
				description: "Sample task description",
				status: TaskStatus.ACTIVE,
				dueDate: null,
				userId: "mock-user-id",
				version: 1,
				createdById: "mock-user-id",
				createdAt: new Date(),
				updatedById: null,
				updatedAt: null,
			},
		],
	},
};
