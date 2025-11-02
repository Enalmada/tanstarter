import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
	title: "Components/Spinner",
	component: Spinner,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InButton: Story = {
	render: () => (
		<button type="button" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
			<Spinner />
			<span>Loading...</span>
		</button>
	),
};

export const Centered: Story = {
	render: () => (
		<div className="flex items-center justify-center h-32 w-full">
			<Spinner />
		</div>
	),
};

export const Large: Story = {
	render: () => <Spinner className="h-8 w-8 border-4" />,
};

export const Small: Story = {
	render: () => <Spinner className="h-3 w-3" />,
};
