import type { Locator } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Sign-in / sign-up page objects for the real better-auth flow (no test token).
 * Field selectors use `name`, so they do not depend on the locale.
 */
abstract class AuthFormPage extends BasePage {
	getEmailInput(): Locator {
		return this.page.locator('input[name="email"]');
	}

	getPasswordInput(): Locator {
		return this.page.locator('input[name="password"]');
	}

	getSubmitButton(): Locator {
		return this.page.locator('form button[type="submit"]');
	}

	getErrorMessage(): Locator {
		return this.page.locator('[class~="bg-destructive/15"]');
	}

	async submit(email: string, password: string): Promise<void> {
		await this.getEmailInput().fill(email);
		await this.getPasswordInput().fill(password);
		await this.getSubmitButton().click();
	}
}

export class SignUpPage extends AuthFormPage {
	protected readonly path = "/signup";
}

export class SignInPage extends AuthFormPage {
	protected readonly path = "/signin";
}
