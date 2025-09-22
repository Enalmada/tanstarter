import type { Meta, StoryObj } from "@storybook/react";
import { NotFound } from "./NotFound";

const meta: Meta<typeof NotFound> = {
	title: "Components/NotFound",
	component: NotFound,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
