import type { Locator } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Member Task Form Page Object
 *
 * Encapsulates interactions with the member task form page (new/edit).
 * Provides methods for filling and submitting the form.
 */
export class MemberTaskFormPage extends BasePage {
	protected readonly path = "/tasks/new";

	/**
	 * Get title input - dynamic locator for new vs edit context
	 */
	private getTitleInput(): Locator {
		return this.page.getByLabel("Title");
	}

	/**
	 * Get description input - dynamic locator for new vs edit context
	 */
	private getDescriptionInput(): Locator {
		return this.page.getByLabel("Description");
	}

	/**
	 * Get create button - dynamic locator for button state
	 */
	getCreateButton(): Locator {
		return this.page.getByRole("button", { name: /create/i });
	}

	/**
	 * Get save button for edit mode
	 */
	getSaveButton(): Locator {
		return this.page.getByRole("button", { name: /save/i });
	}

	/**
	 * Get delete button
	 */
	getDeleteButton(): Locator {
		return this.page.getByRole("button", { name: /delete/i });
	}

	/**
	 * Get form field locators
	 */
	getFormFields() {
		return {
			title: this.getTitleInput(),
			description: this.getDescriptionInput(),
		};
	}

	/**
	 * Fill the title field
	 */
	async fillTitle(title: string): Promise<void> {
		await this.getTitleInput().fill(title);
	}

	/**
	 * Fill the description field
	 */
	async fillDescription(description: string): Promise<void> {
		await this.getDescriptionInput().fill(description);
	}

	/**
	 * Submit the create form
	 */
	async submit(): Promise<void> {
		await this.getCreateButton().click();
	}

	/**
	 * Save changes (for edit mode)
	 */
	async save(): Promise<void> {
		await this.getSaveButton().click();
	}

	/**
	 * Delete the task
	 */
	async delete(): Promise<void> {
		await this.getDeleteButton().click();
	}

	/**
	 * Fill and submit the entire form
	 */
	async createTask(data: { title: string; description?: string }): Promise<void> {
		await this.fillTitle(data.title);

		if (data.description) {
			await this.fillDescription(data.description);
		}

		await this.submit();
	}

	/**
	 * Edit an existing task
	 */
	async editTask(data: { title?: string; description?: string }): Promise<void> {
		if (data.title) {
			await this.fillTitle(data.title);
		}

		if (data.description) {
			await this.fillDescription(data.description);
		}

		await this.save();
	}
}
