import type { Meta, StoryObj } from "@storybook/react";

const EmailWrapper = () => <div>WelcomeEmail Component</div>;

const meta = {
	title: "Emails/WelcomeEmail",
	component: EmailWrapper,
} satisfies Meta<typeof EmailWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
