import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId } from "react";
import { Input } from "./input";

const meta = {
	title: "UI/Input",
	component: Input,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: "Enter text...",
	},
};

export const Disabled: Story = {
	args: {
		placeholder: "Disabled input",
		disabled: true,
	},
};

export const WithValue: Story = {
	args: {
		value: "Hello, World!",
	},
};

export const Password: Story = {
	args: {
		type: "password",
		placeholder: "Enter password...",
	},
};

export const NumberInput: Story = {
	args: {
		type: "number",
		placeholder: "Enter number...",
	},
};

export const Email: Story = {
	args: {
		type: "email",
		placeholder: "Enter email...",
	},
};

function WithLabelComponent() {
	const emailId = useId();

	return (
		<div className="grid w-full max-w-sm gap-1.5">
			<label htmlFor={emailId} className="text-sm font-medium leading-none">
				Email
			</label>
			<Input type="email" id={emailId} placeholder="Enter your email" />
		</div>
	);
}

export const WithLabel = {
	render: () => <WithLabelComponent />,
};
