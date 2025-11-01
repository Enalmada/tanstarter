import type { Meta, StoryObj } from "@storybook/react";
import type { TableDefinition } from "~/types/table";
import { EntityList } from "./EntityList";

interface MockUser {
	id: string;
	name: string;
	email: string;
	role: string;
}

const mockUsers: MockUser[] = [
	{ id: "1", name: "John Doe", email: "john@example.com", role: "Admin" },
	{ id: "2", name: "Jane Smith", email: "jane@example.com", role: "Member" },
	{ id: "3", name: "Bob Wilson", email: "bob@example.com", role: "Member" },
];

const userColumns: TableDefinition<MockUser> = [
	{ key: "name", header: "Name" },
	{ key: "email", header: "Email" },
	{ key: "role", header: "Role" },
];

const meta = {
	title: "Admin/EntityList",
	component: EntityList<MockUser>,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<typeof EntityList<MockUser>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "Users",
		data: mockUsers,
		columns: userColumns,
	},
};

export const WithAddButton: Story = {
	args: {
		title: "Users",
		data: mockUsers,
		columns: userColumns,
		onAdd: () => alert("Add new user"),
	},
};

export const WithRowClick: Story = {
	args: {
		title: "Users",
		data: mockUsers,
		columns: userColumns,
		onRowClick: (user) => alert(`Clicked on ${user.name}`),
	},
};

export const WithLinkNavigation: Story = {
	args: {
		title: "Users",
		data: mockUsers,
		columns: userColumns,
		to: "/admin/users/:id",
	},
};

export const EmptyList: Story = {
	args: {
		title: "Users",
		data: [],
		columns: userColumns,
	},
};
