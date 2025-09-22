import type { Meta, StoryObj } from "@storybook/react";
import { TaskForm } from "./TaskForm";

const meta: Meta<typeof TaskForm> = {
	title: "Components/TaskForm",
	component: TaskForm,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
