import type { Meta, StoryObj } from "@storybook/react";
import type { User } from "~/server/db/schema";
import { UserRole } from "~/server/db/schema";
import { AdminUserForm } from "./UserForm";

const meta = {
	title: "Admin/UserForm",
	component: AdminUserForm,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	args: {
		onSubmit: (values) => {
			// biome-ignore lint/suspicious/noConsole: Storybook action
			console.log("Form submitted:", values);
			alert(`User submitted: ${values.email}`);
		},
		isSubmitting: false,
	},
} satisfies Meta<typeof AdminUserForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const CreateUser: Story = {
	args: {},
};

export const EditMember: Story = {
	args: {
		defaultValues: {
			id: "user_123",
			email: "john.doe@example.com",
			name: "John Doe",
			role: UserRole.MEMBER,
			version: 1,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as User,
	},
};

export const EditAdmin: Story = {
	args: {
		defaultValues: {
			id: "user_456",
			email: "admin@example.com",
			name: "Admin User",
			role: UserRole.ADMIN,
			version: 2,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as User,
	},
};

export const NoName: Story = {
	args: {
		defaultValues: {
			id: "user_789",
			email: "noname@example.com",
			name: null,
			role: UserRole.MEMBER,
			version: 1,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as User,
	},
};

export const Submitting: Story = {
	args: {
		isSubmitting: true,
		defaultValues: {
			id: "user_999",
			email: "submitting@example.com",
			name: "Test User",
			role: UserRole.MEMBER,
			version: 1,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as User,
	},
};
