import type { Locator } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Admin Task Form Page Object
 *
 * Encapsulates interactions with the admin task form page (new/edit).
 * Provides methods for filling and submitting the form.
 */
export class AdminTaskFormPage extends BasePage {
	protected readonly path = "/admin/tasks/new";

	/**
	 * Get title input by placeholder
	 */
	private getTitleInputByPlaceholder(): Locator {
		return this.page.getByPlaceholder("Enter task title");
	}

	/**
	 * Get description input by placeholder
	 */
	private getDescriptionInputByPlaceholder(): Locator {
		return this.page.getByPlaceholder("Enter task description");
	}

	/**
	 * Get title input by label (fallback)
	 */
	private getTitleInput(): Locator {
		return this.page.getByLabel("Title");
	}

	/**
	 * Get description input by label (fallback)
	 */
	private getDescriptionInput(): Locator {
		return this.page.getByLabel("Description");
	}

	/**
	 * Get due date input
	 */
	private getDueDateInput(): Locator {
		return this.page.getByLabel(/due date/i);
	}

	/**
	 * Get status input
	 */
	private getStatusInput(): Locator {
		return this.page.getByLabel(/status/i);
	}

	/**
	 * Get create task button
	 */
	getCreateButton(): Locator {
		return this.page.getByRole("button", { name: "Create Task" });
	}

	/**
	 * Get update task button
	 */
	getUpdateButton(): Locator {
		return this.page.getByRole("button", { name: "Update Task" });
	}

	/**
	 * Get delete task button
	 */
	getDeleteButton(): Locator {
		return this.page.getByRole("button", { name: "Delete Task" });
	}

	/**
	 * Get submit button (generic)
	 */
	getSubmitButton(): Locator {
		return this.page.getByRole("button", { name: /submit/i });
	}

	/**
	 * Get form field locators
	 */
	getFormFields() {
		return {
			title: this.getTitleInput(),
			description: this.getDescriptionInput(),
			dueDate: this.getDueDateInput(),
			status: this.getStatusInput(),
		};
	}

	/**
	 * Fill the title field using placeholder
	 */
	async fillTitleByPlaceholder(title: string): Promise<void> {
		await this.getTitleInputByPlaceholder().fill(title);
	}

	/**
	 * Fill the description field using placeholder
	 */
	async fillDescriptionByPlaceholder(description: string): Promise<void> {
		await this.getDescriptionInputByPlaceholder().fill(description);
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
	 * Fill the due date field
	 */
	async fillDueDate(date: string): Promise<void> {
		await this.getDueDateInput().fill(date);
	}

	/**
	 * Select a status
	 */
	async selectStatus(status: string): Promise<void> {
		await this.getStatusInput().selectOption(status);
	}

	/**
	 * Submit the form (create)
	 */
	async submit(): Promise<void> {
		await this.getCreateButton().click();
	}

	/**
	 * Update the task
	 */
	async update(): Promise<void> {
		await this.getUpdateButton().click();
	}

	/**
	 * Delete the task
	 */
	async delete(): Promise<void> {
		await this.getDeleteButton().click();
	}

	/**
	 * Fill and submit the entire form using placeholders
	 */
	async createTaskByPlaceholder(data: { title: string; description?: string }): Promise<void> {
		await this.fillTitleByPlaceholder(data.title);

		if (data.description) {
			await this.fillDescriptionByPlaceholder(data.description);
		}

		await this.submit();
	}

	/**
	 * Fill and submit the entire form
	 */
	async createTask(data: { title: string; description?: string; dueDate?: string; status?: string }): Promise<void> {
		await this.fillTitle(data.title);

		if (data.description) {
			await this.fillDescription(data.description);
		}

		if (data.dueDate) {
			await this.fillDueDate(data.dueDate);
		}

		if (data.status) {
			await this.selectStatus(data.status);
		}

		await this.submit();
	}

	/**
	 * Edit an existing task
	 */
	async editTask(data: { title?: string; description?: string; dueDate?: string; status?: string }): Promise<void> {
		if (data.title) {
			await this.fillTitleByPlaceholder(data.title);
		}

		if (data.description) {
			await this.fillDescriptionByPlaceholder(data.description);
		}

		if (data.dueDate) {
			await this.fillDueDate(data.dueDate);
		}

		if (data.status) {
			await this.selectStatus(data.status);
		}

		await this.update();
	}

	/**
	 * Get title input value
	 */
	async getTitleValue(): Promise<string> {
		return (await this.getTitleInputByPlaceholder().inputValue()) || "";
	}

	/**
	 * Wait for form to be ready
	 */
	async waitForFormReady(): Promise<void> {
		await this.page.waitForSelector("form", { state: "visible", timeout: 5000 });
		await this.waitForLoadingComplete();
	}
}
