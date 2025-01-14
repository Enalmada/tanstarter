import {
	AbilityBuilder,
	type PureAbility,
	createMongoAbility,
} from "@casl/ability";
import type { ClientUser, Task, UserRole } from "../db/schema";

export type Action =
	| "manage"
	| "list"
	| "read"
	| "create"
	| "update"
	| "delete";

/* clone-code ENTITY_HOOK
{
  "addType": "<%= h.changeCase.pascalCase(name) %>"
}
*/
export type SubjectType = "Task" | "User" | "all";

type AppAbilities = [
	Action,
	SubjectType | { __caslSubjectType__: SubjectType } | Task,
];

export type AppAbility = PureAbility<AppAbilities>;

type DefinePermissions = (
	user: ClientUser,
	builder: AbilityBuilder<AppAbility>,
) => void;

type Roles = UserRole.MEMBER | UserRole.ADMIN;

const rolePermissions: Record<Roles, DefinePermissions> = {
	MEMBER(user, { can }) {
		// USER
		can("read", "User", { id: user.id });

		// TASK
		can("create", "Task", { userId: user.id });
		can("list", "Task", { userId: user.id });
		can("read", "Task", { userId: user.id });
		can("update", "Task", { userId: user.id });
		can("delete", "Task", { userId: user.id });

		/* clone-code ENTITY_HOOK
    {
      "todo": "Add rolePermissions for <%= name %>"
    }
    */
	},
	ADMIN(user, { can }) {
		can("manage", "all");
	},
};

export function defineAbilitiesFor(user: ClientUser | undefined) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const builder = new AbilityBuilder<AppAbility>(createMongoAbility as any);

	if (user) {
		// Type assertion to tell TypeScript that user.role is definitely a valid key
		const role = user.role as Roles;
		if (typeof rolePermissions[role] === "function") {
			rolePermissions[role](user, builder);
		} else {
			throw new Error(`Trying to use unknown role "${user?.role}"`);
		}
	}

	return builder.build();
}
