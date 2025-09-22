import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
	title: "UI/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		children: "Button",
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		variant: "default",
		children: "Primary Button",
	},
};

export const Secondary: Story = {
	args: {
		variant: "secondary",
		children: "Secondary Button",
	},
};

export const Destructive: Story = {
	args: {
		variant: "destructive",
		children: "Destructive Button",
	},
};

export const Outline: Story = {
	args: {
		variant: "outline",
		children: "Outline Button",
	},
};

export const Ghost: Story = {
	args: {
		variant: "ghost",
		children: "Ghost Button",
	},
};

export const Link: Story = {
	args: {
		variant: "link",
		children: "Link Button",
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		children: "Small Button",
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		children: "Large Button",
	},
};

export const Icon: Story = {
	args: {
		size: "icon",
		children: "🔍",
	},
};
