import type { Meta, StoryObj } from "@storybook/react";
import { LocaleSwitcher } from "./LocaleSwitcher";

const meta: Meta<typeof LocaleSwitcher> = {
	title: "Components/LocaleSwitcher",
	component: LocaleSwitcher,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Spanish: Story = {
	globals: { locale: "es" },
};
