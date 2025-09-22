import type { Meta, StoryObj } from "@storybook/react";

const TaskStatusBadgeWrapper = () => <div>TaskStatusBadge Component</div>;

const meta = {
	title: "Components/TaskStatusBadge",
	component: TaskStatusBadgeWrapper,
} satisfies Meta<typeof TaskStatusBadgeWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
