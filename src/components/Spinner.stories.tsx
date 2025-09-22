import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
	title: "Components/Spinner",
	component: Spinner,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
