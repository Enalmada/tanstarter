import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleRenderWelcomePreview } from "~/functions/email-preview";
import { UserRole } from "~/lib/enums/user-role";
import { NotAuthorizedError } from "~/server/access/http-errors";

const emailRender = vi.hoisted(() => ({ render: vi.fn() }));

vi.mock("@react-email/render", () => emailRender);

const preview = (user: { id: string; role: UserRole }) => handleRenderWelcomePreview({ context: { user } as never });

describe("handleRenderWelcomePreview authorization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		emailRender.render.mockResolvedValue("<html>welcome</html>");
	});

	it("renders the preview for an admin", async () => {
		await expect(preview({ id: "usr_admin", role: UserRole.ADMIN })).resolves.toBe("<html>welcome</html>");
		expect(emailRender.render).toHaveBeenCalledOnce();
	});

	it("rejects a member without rendering", async () => {
		await expect(preview({ id: "usr_member", role: UserRole.MEMBER })).rejects.toBeInstanceOf(NotAuthorizedError);
		expect(emailRender.render).not.toHaveBeenCalled();
	});
});
