import type { Meta, StoryObj } from "@storybook/react";

const EntityListWrapper = () => <div>EntityList Component</div>;

const meta = {
	title: "Admin/EntityList",
	component: EntityListWrapper,
} satisfies Meta<typeof EntityListWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
