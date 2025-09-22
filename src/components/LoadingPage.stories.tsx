import type { Meta, StoryObj } from "@storybook/react";
import { LoadingPage } from "./LoadingPage";

const meta: Meta<typeof LoadingPage> = {
	title: "Components/LoadingPage",
	component: LoadingPage,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
