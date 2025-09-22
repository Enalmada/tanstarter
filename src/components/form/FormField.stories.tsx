import type { Meta, StoryObj } from "@storybook/react";

const FormFieldWrapper = () => <div>FormField Component</div>;

const meta = {
	title: "Form/FormField",
	component: FormFieldWrapper,
} satisfies Meta<typeof FormFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
