import type { Meta, StoryObj } from "@storybook/react";
import { email, minLength, object, pipe, string } from "valibot";
import { FormGenerator } from "./FormGenerator";
import type { FormFieldConfig } from "./types";

interface ContactFormData extends Record<string, unknown> {
	name: string;
	email: string;
	message: string;
	subscribe: boolean;
}

interface LoginFormData {
	email: string;
	password: string;
}

interface ProfileFormData {
	name: string;
	bio: string;
	birthdate: Date | null;
	role: string;
	notifications: string;
}

const meta = {
	title: "Form/FormGenerator",
	component: FormGenerator<ContactFormData>,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	args: {
		onSubmit: (values) => {
			// biome-ignore lint/suspicious/noConsole: Storybook action
			console.log("Form submitted:", values);
			alert(`Form submitted! Check console for values.`);
		},
		isSubmitting: false,
	},
} satisfies Meta<typeof FormGenerator<ContactFormData>>;

export default meta;
type Story = StoryObj<typeof meta>;

const contactFormFields: FormFieldConfig<ContactFormData>[] = [
	{
		key: "name",
		type: "text",
		label: "Name",
		placeholder: "Enter your name",
		required: true,
		validation: pipe(string(), minLength(1, "Name is required")),
	},
	{
		key: "email",
		type: "text",
		label: "Email",
		placeholder: "your.email@example.com",
		required: true,
		validation: pipe(string(), email("Please enter a valid email")),
	},
	{
		key: "message",
		type: "textarea",
		label: "Message",
		placeholder: "Enter your message",
		required: true,
		minRows: 4,
		validation: pipe(string(), minLength(10, "Message must be at least 10 characters")),
	},
	{
		key: "subscribe",
		type: "checkbox",
		label: "Subscribe to newsletter",
	},
];

export const Default: Story = {
	args: {
		fields: contactFormFields,
		defaultValues: {
			name: "",
			email: "",
			message: "",
			subscribe: false,
		},
		submitText: "Send Message",
	},
};

export const ContactForm: Story = {
	args: {
		fields: contactFormFields,
		defaultValues: {
			name: "",
			email: "",
			message: "",
			subscribe: false,
		},
		submitText: "Send Message",
	},
};

export const LoginForm: Story = {
	args: {
		fields: [
			{
				key: "email",
				type: "text",
				label: "Email",
				placeholder: "your.email@example.com",
				required: true,
				validation: pipe(string(), email("Please enter a valid email")),
			},
			{
				key: "password",
				type: "text",
				label: "Password",
				placeholder: "Enter your password",
				required: true,
				validation: pipe(string(), minLength(8, "Password must be at least 8 characters")),
			},
		] as FormFieldConfig<LoginFormData>[],
		defaultValues: {
			email: "",
			password: "",
		},
		submitText: "Sign In",
	},
};

export const ProfileForm: Story = {
	args: {
		fields: [
			{
				key: "name",
				type: "text",
				label: "Full Name",
				placeholder: "John Doe",
				required: true,
			},
			{
				key: "bio",
				type: "textarea",
				label: "Bio",
				placeholder: "Tell us about yourself",
				minRows: 3,
				description: "Brief description for your profile",
			},
			{
				key: "birthdate",
				type: "date",
				label: "Birth Date",
			},
			{
				key: "role",
				type: "select",
				label: "Role",
				placeholder: "Select your role",
				options: [
					{ value: "developer", label: "Developer" },
					{ value: "designer", label: "Designer" },
					{ value: "manager", label: "Manager" },
				],
			},
			{
				key: "notifications",
				type: "radio",
				label: "Notification Preference",
				options: [
					{ value: "all", label: "All notifications" },
					{ value: "important", label: "Important only" },
					{ value: "none", label: "None" },
				],
			},
		] as FormFieldConfig<ProfileFormData>[],
		defaultValues: {
			name: "",
			bio: "",
			birthdate: null,
			role: "",
			notifications: "",
		},
		submitText: "Update Profile",
	},
};

export const PrefilledForm: Story = {
	args: {
		fields: contactFormFields,
		defaultValues: {
			name: "John Doe",
			email: "john.doe@example.com",
			message: "This is a pre-filled message for demonstration purposes.",
			subscribe: true,
		},
		submitText: "Send Message",
	},
};

export const SubmittingState: Story = {
	args: {
		fields: contactFormFields,
		defaultValues: {
			name: "John Doe",
			email: "john.doe@example.com",
			message: "Submitting this form...",
			subscribe: false,
		},
		isSubmitting: true,
		submitText: "Send Message",
	},
};

export const WithSchema: Story = {
	args: {
		fields: contactFormFields,
		defaultValues: {
			name: "",
			email: "",
			message: "",
			subscribe: false,
		},
		schema: object({
			name: pipe(string(), minLength(1, "Name is required")),
			email: pipe(string(), email("Please enter a valid email")),
			message: pipe(string(), minLength(10, "Message must be at least 10 characters")),
		}),
		submitText: "Send Message",
	},
};
