import type { Meta, StoryObj } from "@storybook/react";
import { TaskListSkeleton } from "./TaskListSkeleton";

const meta: Meta<typeof TaskListSkeleton> = {
	title: "Components/TaskListSkeleton",
	component: TaskListSkeleton,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
