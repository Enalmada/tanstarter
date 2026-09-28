import { expect, test } from "@playwright/test";

/**
 * Admin Email Preview Tests
 *
 * The preview HTML is rendered by a server function, so the email renderer
 * never ships in the client bundle.
 */
test.describe("Admin Emails", () => {
	test("renders the welcome email preview", async ({ page }) => {
		await page.goto("/admin/emails/welcome");

		await expect(page.getByRole("heading", { name: "Welcome Email Template" })).toBeVisible();
		const preview = page.frameLocator('iframe[title="Email Preview"]');
		await expect(preview.getByRole("heading", { name: "Welcome Jordan!" })).toBeVisible();
	});
});
