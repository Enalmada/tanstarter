import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleMakeUserAdmin } from "~/functions/user-role";
import { UserRole } from "~/lib/enums/user-role";
import { NotAuthorizedError } from "~/server/access/http-errors";

const session = vi.hoisted(() => ({ getOptionalSessionUser: vi.fn() }));
const userDb = vi.hoisted(() => ({
	getUserById: vi.fn(),
	updateUserRole: vi.fn(),
}));
const selfService = vi.hoisted(() => ({ isRoleSelfServiceEnabled: vi.fn() }));

vi.mock("~/server/auth/session", () => session);
vi.mock("~/functions/user.db", () => userDb);
vi.mock("~/server/access/role-self-service", () => selfService);

const member = { id: "usr_member", role: UserRole.MEMBER };
const admin = { id: "usr_admin", role: UserRole.ADMIN };

// The caller freshAuthMiddleware would put on the context
let caller: typeof member | typeof admin = member;

function promote(userId: string) {
	return handleMakeUserAdmin({ data: { userId, role: UserRole.ADMIN }, context: { user: caller as never } });
}

describe("handleMakeUserAdmin authorization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		userDb.getUserById.mockImplementation(async (id: string) => [{ id }]);
		userDb.updateUserRole.mockImplementation(async (id: string, role: string) => [{ id, role }]);
		session.getOptionalSessionUser.mockResolvedValue(null);
	});

	it("lets an admin change another user's role", async () => {
		caller = admin;
		selfService.isRoleSelfServiceEnabled.mockReturnValue(false);

		await expect(promote("usr_other")).resolves.toEqual({ id: "usr_other", role: UserRole.ADMIN });
	});

	it("lets a member promote themselves when self-service is enabled (local dev / DEMO_MODE)", async () => {
		caller = member;
		selfService.isRoleSelfServiceEnabled.mockReturnValue(true);

		await expect(promote(member.id)).resolves.toEqual({ id: member.id, role: UserRole.ADMIN });
	});

	it("rejects a member promoting themselves when self-service is disabled", async () => {
		caller = member;
		selfService.isRoleSelfServiceEnabled.mockReturnValue(false);

		await expect(promote(member.id)).rejects.toBeInstanceOf(NotAuthorizedError);
		expect(userDb.updateUserRole).not.toHaveBeenCalled();
	});

	it("rejects a member changing another user's role even with self-service enabled", async () => {
		caller = member;
		selfService.isRoleSelfServiceEnabled.mockReturnValue(true);

		await expect(promote("usr_other")).rejects.toBeInstanceOf(NotAuthorizedError);
		expect(userDb.getUserById).not.toHaveBeenCalled();
		expect(userDb.updateUserRole).not.toHaveBeenCalled();
	});
});
