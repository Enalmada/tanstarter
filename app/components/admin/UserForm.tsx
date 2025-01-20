import type { User, UserRoleType } from "~/server/db/schema";
import { UserRole } from "~/server/db/schema";
import { FormGenerator } from "../form/FormGenerator";
import type { FormFieldConfig } from "../form/types";

export type UserFormData = {
	email: string;
	name: string | null;
	role: UserRoleType;
	version: number | null;
};

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
	const fields: FormFieldConfig<UserFormData>[] = [
		{
			key: "version",
			type: "hidden",
		},
		{
			key: "email",
			type: "text",
			label: "Email",
			placeholder: "Enter user email",
			required: true,
		},
		{
			key: "name",
			type: "text",
			label: "Name",
			placeholder: "Enter user name",
		},
		{
			key: "role",
			type: "select",
			label: "Role",
			options: [
				{ value: UserRole.MEMBER, label: "Member" },
				{ value: UserRole.ADMIN, label: "Admin" },
			],
		},
	];

	return (
		<FormGenerator<UserFormData>
			fields={fields}
			defaultValues={{
				email: defaultValues?.email ?? "",
				name: defaultValues?.name ?? null,
				role: defaultValues?.role ?? UserRole.MEMBER,
				version: defaultValues?.version ?? null,
			}}
			onSubmit={onSubmit}
			isSubmitting={isSubmitting}
		/>
	);
}
