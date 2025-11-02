import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "@tanstack/react-form";
import { FormField } from "./FormField";
import type { FormFieldConfig } from "./types";

interface FormData {
	textField: string;
	textareaField: string;
	dateField: Date | null;
	selectField: string;
	checkboxField: boolean;
	radioField: string;
}

function FormFieldDemo({ config }: { config: FormFieldConfig<FormData> }) {
	const form = useForm({
		defaultValues: {
			textField: "",
			textareaField: "",
			dateField: null,
			selectField: "",
			checkboxField: false,
			radioField: "",
		} as FormData,
		onSubmit: async ({ value }) => {
			// biome-ignore lint/suspicious/noConsole: Storybook demo
			console.log("Form submitted:", value);
			alert(`Form submitted! Check console for values.`);
		},
	});

	return (
		<div className="max-w-md p-4">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name={config.key as keyof FormData}>
					{(field) => <FormField field={field} config={config} />}
				</form.Field>
			</form>
		</div>
	);
}

const meta = {
	title: "Form/FormField",
	component: FormFieldDemo,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof FormFieldDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextField: Story = {
	args: {
		config: {
			key: "textField",
			type: "text",
			label: "Text Input",
			placeholder: "Enter some text",
			required: true,
			description: "This is a helpful description for the text field",
		},
	},
};

export const TextFieldWithError: Story = {
	args: {
		config: {
			key: "textField",
			type: "text",
			label: "Text Input (with error)",
			placeholder: "Enter some text",
			required: true,
		},
	},
};

export const TextareaField: Story = {
	args: {
		config: {
			key: "textareaField",
			type: "textarea",
			label: "Textarea",
			placeholder: "Enter a longer description",
			description: "You can enter multiple lines of text here",
			minRows: 5,
		},
	},
};

export const DateField: Story = {
	args: {
		config: {
			key: "dateField",
			type: "date",
			label: "Date Picker",
			required: true,
			description: "Select a date from the calendar",
		},
	},
};

export const SelectField: Story = {
	args: {
		config: {
			key: "selectField",
			type: "select",
			label: "Select Dropdown",
			placeholder: "Choose an option",
			required: true,
			options: [
				{ value: "option1", label: "Option 1" },
				{ value: "option2", label: "Option 2" },
				{ value: "option3", label: "Option 3" },
			],
			description: "Select one option from the dropdown",
		},
	},
};

export const CheckboxField: Story = {
	args: {
		config: {
			key: "checkboxField",
			type: "checkbox",
			label: "Accept terms and conditions",
			required: true,
		},
	},
};

export const RadioField: Story = {
	args: {
		config: {
			key: "radioField",
			type: "radio",
			label: "Choose your preference",
			required: true,
			options: [
				{ value: "email", label: "Email notifications" },
				{ value: "sms", label: "SMS notifications" },
				{ value: "none", label: "No notifications" },
			],
			description: "Select how you want to be notified",
		},
	},
};

export const DisabledField: Story = {
	args: {
		config: {
			key: "textField",
			type: "text",
			label: "Disabled Input",
			placeholder: "This field is disabled",
			disabled: true,
		},
	},
};
