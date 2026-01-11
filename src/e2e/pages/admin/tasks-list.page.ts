import type { Locator } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Admin Tasks List Page Object
 *
 * Encapsulates interactions with the admin tasks list page.
 * Provides methods for common actions like viewing tasks and navigation.
 */
export class AdminTasksListPage extends BasePage {
	protected readonly path = "/admin/tasks";

	/**
	 * Get the Add New button
	 */
	getAddNewButton(): Locator {
		return this.page.getByRole("button", { name: "Add New" });
	}

	/**
	 * Get table column headers
	 */
	getTableColumns() {
		return {
			title: this.page.getByRole("columnheader", { name: "Title" }),
			status: this.page.getByRole("columnheader", { name: "Status" }),
			dueDate: this.page.getByRole("columnheader", { name: "Due Date" }),
			created: this.page.getByRole("columnheader", { name: "Created" }),
			lastUpdated: this.page.getByRole("columnheader", {
				name: "Last Updated",
			}),
		};
	}

	/**
	 * Click the Add New button to create a task
	 */
	async clickAddNew(): Promise<void> {
		await this.getAddNewButton().click();
	}
}
