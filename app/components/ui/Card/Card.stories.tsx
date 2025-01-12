import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta = {
	title: "UI/Card",
	component: Card,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		shadow: {
			control: "select",
			options: ["xs", "sm", "md", "lg", "xl"],
		},
		radius: {
			control: "select",
			options: ["xs", "sm", "md", "lg", "xl"],
		},
		withBorder: {
			control: "boolean",
		},
		p: {
			control: "select",
			options: ["xs", "sm", "md", "lg", "xl"],
		},
	},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: (
			<div className="w-64">
				<h3 className="text-lg font-semibold mb-2">Card Title</h3>
				<p className="text-gray-600">
					This is a sample card component that demonstrates Mantine Paper usage.
				</p>
			</div>
		),
		p: "md",
	},
};

export const WithShadow: Story = {
	args: {
		shadow: "md",
		children: (
			<div className="w-64">
				<h3 className="text-lg font-semibold mb-2">Card with Shadow</h3>
				<p className="text-gray-600">A card with medium shadow.</p>
			</div>
		),
		p: "md",
	},
};

export const WithBorder: Story = {
	args: {
		withBorder: true,
		children: (
			<div className="w-64">
				<h3 className="text-lg font-semibold mb-2">Card with Border</h3>
				<p className="text-gray-600">A card with a border.</p>
			</div>
		),
		p: "md",
	},
};

export const WithImage: Story = {
	args: {
		p: 0,
		children: (
			<div className="w-64">
				<img
					src="https://picsum.photos/256/144"
					alt="Sample"
					className="w-full h-36 object-cover"
				/>
				<div className="p-4">
					<h3 className="text-lg font-semibold mb-2">Card with Image</h3>
					<p className="text-gray-600">A card with a header image.</p>
				</div>
			</div>
		),
	},
};
