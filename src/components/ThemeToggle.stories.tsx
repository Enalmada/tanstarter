import type { Meta, StoryObj } from "@storybook/react";
import ThemeToggle from "./ThemeToggle";

const meta: Meta<typeof ThemeToggle> = {
	title: "Components/ThemeToggle",
	component: ThemeToggle,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
