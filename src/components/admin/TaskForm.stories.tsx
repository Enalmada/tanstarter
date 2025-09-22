import type { Meta, StoryObj } from "@storybook/react";

const TaskFormWrapper = () => <div>TaskForm Component</div>;

const meta = {
	title: "Admin/TaskForm",
	component: TaskFormWrapper,
} satisfies Meta<typeof TaskFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
