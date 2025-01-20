import { Button, Stack } from "@mantine/core";
import type { FieldValidators } from "@tanstack/form-core";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { ValiError, parse } from "valibot";
import { FormField } from "./FormField";
import type { CheckboxFieldConfig, FormConfig, FormFieldConfig } from "./types";

function hasTransform<T>(
	field: FormFieldConfig<T>,
): field is CheckboxFieldConfig<T> & {
	transform: NonNullable<CheckboxFieldConfig<T>["transform"]>;
} {
	return "transform" in field && field.transform !== undefined;
}

interface FormGeneratorProps<TData extends Record<string, unknown>>
	extends FormConfig<TData> {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	schema?: any;
	submitText?: string;
}

export function FormGenerator<TData extends Record<string, unknown>>({
	fields,
	defaultValues,
	onSubmit,
	isSubmitting = false,
	schema,
	submitText = "Submit",
}: FormGeneratorProps<TData>) {
	const [error, setError] = useState<string | null>(null);

	const form = useForm<TData>({
		defaultValues: defaultValues as TData,
		onSubmit: async ({ value }) => {
			try {
				// Transform any field values if needed
				const transformedValue = Object.fromEntries(
					Object.entries(value).map(([key, val]) => {
						const field = fields.find((f) => f.key === key);
						if (field && hasTransform(field)) {
							// For checkbox fields, we know the value should be boolean
							if (field.type === "checkbox") {
								// First transform the value to a boolean using the field's input transform
								const boolValue = field.transform.input(val);
								return [key, field.transform.output(boolValue)];
							}
						}
						return [key, val];
					}),
				) as TData;

				if (schema) {
					const result = parse(schema, transformedValue);
					await onSubmit(result);
				} else {
					await onSubmit(transformedValue);
				}
			} catch (err) {
				if (err instanceof ValiError) {
					setError(
						`Validation error: ${err.message}\nDetails: ${JSON.stringify(
							err.issues,
							null,
							2,
						)}`,
					);
				} else {
					setError(
						`Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
					);
				}
			}
		},
		validators: {
			onSubmit: ({ value }) => {
				try {
					// Validate each field with its validation schema
					for (const field of fields) {
						if (field.validation) {
							parse(field.validation, value[field.key]);
						}
					}
					return;
				} catch (err) {
					if (err instanceof ValiError) {
						return err.issues[0]?.message || "Validation failed";
					}
					return "Form validation failed";
				}
			},
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<Stack gap="md">
				{fields.map((fieldConfig) => {
					// biome-ignore lint/suspicious/noExplicitAny: TanStack Form has complex type constraints that are difficult to satisfy
					const validators: FieldValidators<TData, any> = fieldConfig.validation
						? {
								onChange: ({ value }) => {
									try {
										if (fieldConfig.validation) {
											parse(fieldConfig.validation, value);
										}
										return undefined;
									} catch (err) {
										if (err instanceof ValiError) {
											return err.issues[0]?.message || "Invalid value";
										}
										return "Invalid value";
									}
								},
							}
						: {};

					return (
						<form.Field
							key={fieldConfig.key}
							// biome-ignore lint/suspicious/noExplicitAny: TanStack Form has complex type constraints that are difficult to satisfy
							name={fieldConfig.key as any}
							validators={validators}
						>
							{(field) => <FormField field={field} config={fieldConfig} />}
						</form.Field>
					);
				})}

				{error && <div className="text-red-500 text-sm">{error}</div>}

				<Button
					type="submit"
					loading={isSubmitting}
					disabled={isSubmitting || form.state.isSubmitting}
				>
					{submitText}
				</Button>
			</Stack>
		</form>
	);
}
