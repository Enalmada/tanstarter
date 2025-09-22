import type { Meta, StoryObj } from "@storybook/react";

const FormGeneratorWrapper = () => <div>FormGenerator Component</div>;

const meta = {
	title: "Form/FormGenerator",
	component: FormGeneratorWrapper,
} satisfies Meta<typeof FormGeneratorWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
