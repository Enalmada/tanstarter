import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Navbar } from "./Navbar";

const meta: Meta<typeof Navbar> = {
	title: "Components/Navbar",
	component: Navbar,
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Toolbar locale global is applied by .storybook/preview.tsx before render
export const Spanish: Story = {
	globals: { locale: "es" },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(await canvas.findByText("Iniciar sesión")).toBeInTheDocument();
	},
};
