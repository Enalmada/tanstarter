import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId } from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
	title: "UI/Checkbox",
	component: Checkbox,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Checkbox />,
};

function WithLabelComponent() {
	const termsId = useId();

	return (
		<div className="flex items-center space-x-2">
			<Checkbox id={termsId} />
			<Label htmlFor={termsId}>Accept terms and conditions</Label>
		</div>
	);
}

export const WithLabel: Story = {
	render: () => <WithLabelComponent />,
};

export const Checked: Story = {
	render: () => <Checkbox checked />,
};

export const Disabled: Story = {
	render: () => <Checkbox disabled />,
};

export const DisabledChecked: Story = {
	render: () => <Checkbox disabled checked />,
};
