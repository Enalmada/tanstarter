import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
	title: "UI/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: "select",
			options: ["xs", "sm", "md", "lg", "xl"],
		},
		variant: {
			control: "select",
			options: [
				"default",
				"filled",
				"light",
				"outline",
				"subtle",
				"transparent",
				"white",
			],
		},
		color: {
			control: "select",
			options: [
				"blue",
				"cyan",
				"grape",
				"gray",
				"green",
				"indigo",
				"orange",
				"pink",
				"red",
				"teal",
				"violet",
				"yellow",
			],
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		children: "Click me",
		variant: "filled",
		size: "md",
	},
};

export const Secondary: Story = {
	args: {
		children: "Click me",
		variant: "light",
		size: "md",
	},
};

export const Outline: Story = {
	args: {
		children: "Click me",
		variant: "outline",
		size: "md",
	},
};

export const Small: Story = {
	args: {
		children: "Small Button",
		size: "sm",
	},
};

export const Large: Story = {
	args: {
		children: "Large Button",
		size: "lg",
	},
};

export const WithIcon: Story = {
	args: {
		children: (
			<>
				<span className="mr-2">🚀</span>
				Launch
			</>
		),
		size: "md",
	},
};
