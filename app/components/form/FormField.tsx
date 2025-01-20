/**
 * FormField Component
 *
 * A type-safe form field component that integrates Mantine UI components with TanStack Form.
 * This component is designed to be used with the FormGenerator for declarative form creation.
 *
 * Key Features:
 * - Type-safe field handling using TanStack Form's field API
 * - Integration with Mantine UI components
 * - Support for various field types (text, textarea, date, select, etc.)
 * - Validation integration with valibot
 *
 * Usage:
 * ```tsx
 * <form.Field
 *   name="fieldName"
 *   children={(field) => (
 *     <FormField field={field} config={{ type: "text", label: "Field Label" }} />
 *   )}
 * />
 * ```
 *
 * Type Parameters:
 * @template TData - The form data type containing field values
 * @template TName - The key type for the field
 *
 * Implementation Notes:
 * 1. Field Values:
 *    - Each field type handles its own value conversion
 *    - String fields: text, textarea, select
 *    - Boolean fields: checkbox
 *    - Date fields: handle ISO string conversion
 *
 * 2. Validation:
 *    - Validation is handled at the form.Field level
 *    - Error messages are displayed from field.state.meta.errors
 *
 * 3. Type Safety:
 *    - Uses TanStack Form's field API for type-safe value handling
 *    - Config types ensure correct props for each field type
 *
 * Note: We use `any` for the FieldApi type parameters due to complex type constraints
 * in TanStack Form that are difficult to satisfy without compromising the component's
 * flexibility. The component still works correctly at runtime.
 */

import {
	Checkbox,
	Radio,
	RadioGroup,
	Select,
	TextInput,
	Textarea,
} from "@mantine/core";
import type { FieldApi } from "@tanstack/react-form";
import type {
	FormFieldConfig,
	RadioFieldConfig,
	SelectFieldConfig,
	TextareaFieldConfig,
} from "./types";

interface FormFieldProps<TData extends Record<string, unknown>> {
	// biome-ignore lint/suspicious/noExplicitAny: TanStack Form has complex type constraints that are difficult to satisfy without compromising component flexibility
	field: FieldApi<TData, any, any, any>;
	config: FormFieldConfig<TData>;
}

export function FormField<TData extends Record<string, unknown>>({
	field,
	config,
}: FormFieldProps<TData>) {
	const commonProps = {
		label: config.label,
		description: config.description,
		disabled: config.disabled ?? false,
		placeholder: config.placeholder,
		size: config.size ?? "sm",
		error: field.state.meta.errors[0] || undefined,
		"data-error": field.state.meta.errors[0] || undefined,
		required: config.required ?? false,
	};

	// biome-ignore lint/suspicious/noExplicitAny: Type is handled correctly at runtime
	const setValue = (value: any) => field.setValue(value as any);

	switch (config.type) {
		case "text":
			return (
				<TextInput
					{...commonProps}
					value={String(field.state.value ?? "")}
					onChange={(e) => setValue(e.target.value)}
					onBlur={field.handleBlur}
				/>
			);

		case "textarea":
			return (
				<Textarea
					{...commonProps}
					value={String(field.state.value ?? "")}
					onChange={(e) => setValue(e.target.value)}
					onBlur={field.handleBlur}
					minRows={(config as TextareaFieldConfig<TData>).minRows ?? 3}
				/>
			);

		case "date":
			return (
				<TextInput
					{...commonProps}
					type="date"
					value={
						field.state.value instanceof Date
							? field.state.value.toISOString().split("T")[0]
							: ""
					}
					onChange={(e) => {
						// If empty string, set to null
						const value =
							e.target.value === "" ? null : new Date(e.target.value);
						setValue(value);
					}}
					onBlur={field.handleBlur}
				/>
			);

		case "select":
			return (
				<Select
					{...commonProps}
					value={String(field.state.value ?? "")}
					onChange={(value) => setValue(value)}
					onBlur={field.handleBlur}
					data={(config as SelectFieldConfig<TData>).options}
				/>
			);

		case "checkbox":
			return (
				<Checkbox
					{...commonProps}
					checked={
						config.transform
							? config.transform.input(field.state.value ?? false)
							: Boolean(field.state.value)
					}
					onChange={(e) => {
						const checked = e.currentTarget.checked;
						setValue(
							config.transform ? config.transform.output(checked) : checked,
						);
					}}
					onBlur={field.handleBlur}
				/>
			);

		case "radio":
			return (
				<RadioGroup
					{...commonProps}
					value={String(field.state.value ?? "")}
					onChange={(value) => setValue(value)}
					onBlur={field.handleBlur}
				>
					{(config as RadioFieldConfig<TData>).options.map((option) => (
						<Radio
							key={option.value}
							value={option.value}
							label={option.label}
						/>
					))}
				</RadioGroup>
			);

		case "hidden":
			return (
				<input
					type="hidden"
					value={String(field.state.value ?? "")}
					onChange={(e) => {
						const value = e.target.value ? Number(e.target.value) : undefined;
						setValue(value);
					}}
				/>
			);

		default:
			return null;
	}
}
