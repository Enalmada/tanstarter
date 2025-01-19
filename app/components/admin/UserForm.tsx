import { Button, Select, Stack, TextInput } from "@mantine/core";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { ValiError, parse } from "valibot";
import type { User, UserRoleType } from "~/server/db/schema";
import { UserRole, userFormSchema } from "~/server/db/schema";

// Use the form schema type
type FormFields = {
	email: string;
	name?: string | null;
	role: UserRoleType;
	version: number | undefined;
};

export type UserFormData = FormFields;

interface AdminUserFormProps {
	defaultValues?: Partial<User>;
	onSubmit: (values: UserFormData) => void;
	isSubmitting?: boolean;
}

export function AdminUserForm({
	defaultValues,
	onSubmit,
	isSubmitting = false,
}: AdminUserFormProps) {
	const [error, setError] = useState<string | null>(null);

	const form = useForm<FormFields>({
		defaultValues: {
			email: defaultValues?.email ?? "",
			name: defaultValues?.name ?? null,
			role: defaultValues?.role ?? UserRole.MEMBER,
			version: defaultValues?.version,
		},
		onSubmit: async ({ value }) => {
			try {
				const result = parse(userFormSchema, value);
				onSubmit(result as FormFields);
			} catch (err) {
				if (err instanceof ValiError) {
					setError(err.message);
				}
			}
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
				<form.Field name="version">
					{(field) => (
						<input
							type="hidden"
							value={field.state.value?.toString() ?? ""}
							onChange={(e) =>
								field.handleChange(
									e.target.value ? Number(e.target.value) : undefined,
								)
							}
						/>
					)}
				</form.Field>

				<form.Field
					name="email"
					validators={{
						onChange: ({ value }) => {
							if (!value) return "Email is required";
							if (!value.includes("@")) return "Invalid email address";
							return undefined;
						},
					}}
				>
					{(field) => (
						<TextInput
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							label="Email"
							placeholder="Enter user email"
							required
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.Field>

				<form.Field name="name">
					{(field) => (
						<TextInput
							value={field.state.value ?? ""}
							onChange={(e) => field.handleChange(e.target.value || null)}
							onBlur={field.handleBlur}
							label="Name"
							placeholder="Enter user name"
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.Field>

				<form.Field name="role">
					{(field) => (
						<Select
							value={field.state.value ?? null}
							onChange={(value) => field.handleChange(value as UserRoleType)}
							onBlur={field.handleBlur}
							label="Role"
							data={[
								{ value: UserRole.MEMBER, label: "Member" },
								{ value: UserRole.ADMIN, label: "Admin" },
							]}
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.Field>

				{error && <div className="text-red-500 text-sm">{error}</div>}

				<Button
					type="submit"
					loading={isSubmitting}
					disabled={isSubmitting || form.state.isSubmitting}
				>
					{defaultValues ? "Update User" : "Create User"}
				</Button>
			</Stack>
		</form>
	);
}
