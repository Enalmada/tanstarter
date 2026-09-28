import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleRenderWelcomePreview } from "~/functions/email-preview";
import { UserRole } from "~/lib/enums/user-role";
import { NotAuthorizedError } from "~/server/access/http-errors";

const session = vi.hoisted(() => ({ requireAuthedUser: vi.fn() }));
const emailRender = vi.hoisted(() => ({ render: vi.fn() }));

vi.mock("~/server/auth/session", () => session);
vi.mock("@react-email/render", () => emailRender);

describe("handleRenderWelcomePreview authorization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		emailRender.render.mockResolvedValue("<html>welcome</html>");
	});

	it("renders the preview for an admin", async () => {
		session.requireAuthedUser.mockResolvedValue({ id: "usr_admin", role: UserRole.ADMIN });

		await expect(handleRenderWelcomePreview()).resolves.toBe("<html>welcome</html>");
		expect(emailRender.render).toHaveBeenCalledOnce();
	});

	it("rejects a member without rendering", async () => {
		session.requireAuthedUser.mockResolvedValue({ id: "usr_member", role: UserRole.MEMBER });

		await expect(handleRenderWelcomePreview()).rejects.toBeInstanceOf(NotAuthorizedError);
		expect(emailRender.render).not.toHaveBeenCalled();
	});

	it("propagates the unauthenticated error without rendering", async () => {
		session.requireAuthedUser.mockRejectedValue(new Error("Unauthorized"));

		await expect(handleRenderWelcomePreview()).rejects.toThrow("Unauthorized");
		expect(emailRender.render).not.toHaveBeenCalled();
	});
});
