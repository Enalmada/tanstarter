import type { BaseIssue, BaseSchema } from "valibot";

export type FormFieldType = "text" | "textarea" | "date" | "select" | "checkbox" | "radio" | "hidden";

export interface BaseFieldConfig<T> {
	key: keyof T & string;
	label?: string;
	description?: string;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	validation?: BaseSchema<unknown, unknown, BaseIssue<unknown>>;
}

export interface TextFieldConfig<T> extends BaseFieldConfig<T> {
	type: "text";
}

export interface TextareaFieldConfig<T> extends BaseFieldConfig<T> {
	type: "textarea";
	minRows?: number;
	maxRows?: number;
}

export interface DateFieldConfig<T> extends BaseFieldConfig<T> {
	type: "date";
	minDate?: Date;
	maxDate?: Date;
}

export interface SelectFieldConfig<T> extends BaseFieldConfig<T> {
	type: "select";
	options: Array<{ value: string; label: string }>;
	searchable?: boolean;
	clearable?: boolean;
}

export interface CheckboxFieldConfig<T> extends BaseFieldConfig<T> {
	type: "checkbox";
	transform?: {
		input: (value: unknown) => boolean;
		output: (checked: boolean) => unknown;
	};
}

export interface RadioFieldConfig<T> extends BaseFieldConfig<T> {
	type: "radio";
	options: Array<{ value: string; label: string }>;
}

export interface HiddenFieldConfig<T> extends BaseFieldConfig<T> {
	type: "hidden";
}

export type FormFieldConfig<T> =
	| TextFieldConfig<T>
	| TextareaFieldConfig<T>
	| DateFieldConfig<T>
	| SelectFieldConfig<T>
	| CheckboxFieldConfig<T>
	| RadioFieldConfig<T>
	| HiddenFieldConfig<T>;

export interface FormConfig<T> {
	fields: FormFieldConfig<T>[];
	defaultValues?: Partial<T>;
	onSubmit: (values: T) => void | Promise<void>;
	isSubmitting?: boolean;
}

export type FormValues<T extends FormFieldConfig<Record<string, unknown>>[]> = {
	[K in T[number]["key"]]: unknown;
};

export interface FormError {
	message: string;
	issues?: Array<{ path: string; message: string }>;
}
