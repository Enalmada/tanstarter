import type { Meta, StoryObj } from "@storybook/react";

const UserFormWrapper = () => <div>UserForm Component</div>;

const meta = {
	title: "Admin/UserForm",
	component: UserFormWrapper,
} satisfies Meta<typeof UserFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
