/**
 * FormField Component
 *
 * A type-safe form field component that integrates Shadcn/ui components with TanStack Form.
 * This component is designed to be used with the FormGenerator for declarative form creation.
 *
 * Key Features:
 * - Type-safe field handling using TanStack Form's field API
 * - Integration with Shadcn UI components
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
 * Note: We use a simplified type for FieldApi due to complex type constraints
 * in TanStack Form that are difficult to satisfy without compromising the component's
 * flexibility. The component still works correctly at runtime.
 */

import type { AnyFieldApi } from "@tanstack/react-form";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import type {
	FormFieldConfig,
	RadioFieldConfig,
	SelectFieldConfig,
	TextareaFieldConfig,
} from "./types";

interface FormFieldProps<TData extends Record<string, unknown>> {
	// Update to use AnyFieldApi which doesn't require all type parameters
	field: AnyFieldApi;
	config: FormFieldConfig<TData>;
}

export function FormField<TData extends Record<string, unknown>>({
	field,
	config,
}: FormFieldProps<TData>) {
	const hasError = field.state.meta.errors.length > 0;
	const errorMessage = field.state.meta.errors[0];

	// biome-ignore lint/suspicious/noExplicitAny: Type is handled correctly at runtime
	const setValue = (value: any) => field.setValue(value as any);

	const renderField = () => {
		switch (config.type) {
			case "text": {
				return (
					<div className="grid w-full gap-1.5">
						{config.label && (
							<Label
								htmlFor={config.key}
								className={cn(hasError && "text-destructive")}
							>
								{config.label}
								{config.required && (
									<span className="text-destructive ml-1">*</span>
								)}
							</Label>
						)}
						<Input
							id={config.key}
							value={String(field.state.value ?? "")}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setValue(e.target.value)
							}
							onBlur={field.handleBlur}
							disabled={config.disabled ?? false}
							placeholder={config.placeholder}
							className={cn(hasError && "border-destructive")}
							aria-invalid={hasError}
							aria-errormessage={hasError ? `${config.key}-error` : undefined}
						/>
						{config.description && (
							<p className="text-sm text-muted-foreground">
								{config.description}
							</p>
						)}
						{hasError && (
							<p
								className="text-sm text-destructive"
								id={`${config.key}-error`}
							>
								{errorMessage}
							</p>
						)}
					</div>
				);
			}

			case "textarea": {
				return (
					<div className="grid w-full gap-1.5">
						{config.label && (
							<Label
								htmlFor={config.key}
								className={cn(hasError && "text-destructive")}
							>
								{config.label}
								{config.required && (
									<span className="text-destructive ml-1">*</span>
								)}
							</Label>
						)}
						<Textarea
							id={config.key}
							value={String(field.state.value ?? "")}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
								setValue(e.target.value)
							}
							onBlur={field.handleBlur}
							disabled={config.disabled ?? false}
							placeholder={config.placeholder}
							className={cn(hasError && "border-destructive")}
							rows={(config as TextareaFieldConfig<TData>).minRows ?? 3}
							aria-invalid={hasError}
							aria-errormessage={hasError ? `${config.key}-error` : undefined}
						/>
						{config.description && (
							<p className="text-sm text-muted-foreground">
								{config.description}
							</p>
						)}
						{hasError && (
							<p
								className="text-sm text-destructive"
								id={`${config.key}-error`}
							>
								{errorMessage}
							</p>
						)}
					</div>
				);
			}

			case "date": {
				return (
					<div className="grid w-full gap-1.5">
						{config.label && (
							<Label
								htmlFor={config.key}
								className={cn(hasError && "text-destructive")}
							>
								{config.label}
								{config.required && (
									<span className="text-destructive ml-1">*</span>
								)}
							</Label>
						)}
						<Input
							id={config.key}
							type="date"
							value={
								field.state.value instanceof Date
									? field.state.value.toISOString().split("T")[0]
									: ""
							}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								const value =
									e.target.value === "" ? null : new Date(e.target.value);
								setValue(value);
							}}
							onBlur={field.handleBlur}
							disabled={config.disabled ?? false}
							className={cn(hasError && "border-destructive")}
							aria-invalid={hasError}
							aria-errormessage={hasError ? `${config.key}-error` : undefined}
						/>
						{config.description && (
							<p className="text-sm text-muted-foreground">
								{config.description}
							</p>
						)}
						{hasError && (
							<p
								className="text-sm text-destructive"
								id={`${config.key}-error`}
							>
								{errorMessage}
							</p>
						)}
					</div>
				);
			}

			case "select": {
				const selectConfig = config as SelectFieldConfig<TData>;
				return (
					<div className="grid w-full gap-1.5">
						{config.label && (
							<Label
								htmlFor={config.key}
								className={cn(hasError && "text-destructive")}
							>
								{config.label}
								{config.required && (
									<span className="text-destructive ml-1">*</span>
								)}
							</Label>
						)}
						<Select
							value={String(field.state.value ?? "")}
							onValueChange={setValue}
							disabled={config.disabled ?? false}
						>
							<SelectTrigger
								id={config.key}
								className={cn(hasError && "border-destructive")}
								aria-invalid={hasError}
								aria-errormessage={hasError ? `${config.key}-error` : undefined}
							>
								<SelectValue placeholder={config.placeholder} />
							</SelectTrigger>
							<SelectContent>
								{selectConfig.options.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{config.description && (
							<p className="text-sm text-muted-foreground">
								{config.description}
							</p>
						)}
						{hasError && (
							<p
								className="text-sm text-destructive"
								id={`${config.key}-error`}
							>
								{errorMessage}
							</p>
						)}
					</div>
				);
			}

			case "checkbox": {
				return (
					<div className="flex items-center space-x-2">
						<Checkbox
							id={config.key}
							checked={
								config.transform
									? config.transform.input(field.state.value ?? false)
									: Boolean(field.state.value)
							}
							onCheckedChange={(checked: boolean) => {
								setValue(
									config.transform ? config.transform.output(checked) : checked,
								);
							}}
							disabled={config.disabled ?? false}
							aria-invalid={hasError}
							aria-errormessage={hasError ? `${config.key}-error` : undefined}
						/>
						{config.label && (
							<Label
								htmlFor={config.key}
								className={cn(
									"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
									hasError && "text-destructive",
								)}
							>
								{config.label}
								{config.required && (
									<span className="text-destructive ml-1">*</span>
								)}
							</Label>
						)}
						{hasError && (
							<p
								className="text-sm text-destructive"
								id={`${config.key}-error`}
							>
								{errorMessage}
							</p>
						)}
					</div>
				);
			}

			case "radio": {
				const radioConfig = config as RadioFieldConfig<TData>;
				return (
					<div className="grid w-full gap-1.5">
						{config.label && (
							<Label className={cn(hasError && "text-destructive")}>
								{config.label}
								{config.required && (
									<span className="text-destructive ml-1">*</span>
								)}
							</Label>
						)}
						<RadioGroup
							value={String(field.state.value ?? "")}
							onValueChange={setValue}
							disabled={config.disabled ?? false}
							className="flex flex-col space-y-1"
							aria-invalid={hasError}
							aria-errormessage={hasError ? `${config.key}-error` : undefined}
						>
							{radioConfig.options.map((option) => (
								<div key={option.value} className="flex items-center space-x-2">
									<RadioGroupItem
										value={option.value}
										id={`${config.key}-${option.value}`}
									/>
									<Label
										htmlFor={`${config.key}-${option.value}`}
										className="text-sm font-normal"
									>
										{option.label}
									</Label>
								</div>
							))}
						</RadioGroup>
						{config.description && (
							<p className="text-sm text-muted-foreground">
								{config.description}
							</p>
						)}
						{hasError && (
							<p
								className="text-sm text-destructive"
								id={`${config.key}-error`}
							>
								{errorMessage}
							</p>
						)}
					</div>
				);
			}

			case "hidden": {
				return (
					<input
						type="hidden"
						value={String(field.state.value ?? "")}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							const value = e.target.value ? Number(e.target.value) : undefined;
							setValue(value);
						}}
					/>
				);
			}

			default:
				return null;
		}
	};

	return renderField();
}
