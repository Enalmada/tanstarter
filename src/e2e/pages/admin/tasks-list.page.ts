import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Admin Tasks List Page Object
 *
 * Encapsulates interactions with the admin tasks list page.
 * Provides methods for common actions like viewing tasks and navigation.
 */
export class AdminTasksListPage extends BasePage {
	protected readonly path = "/admin/tasks";

	// Locators
	private readonly addNewButton: Locator;
	private readonly titleColumn: Locator;
	private readonly statusColumn: Locator;
	private readonly dueDateColumn: Locator;
	private readonly createdColumn: Locator;
	private readonly lastUpdatedColumn: Locator;

	constructor(page: Page) {
		super(page);
		this.addNewButton = page.getByRole("button", { name: "Add New" });
		this.titleColumn = page.getByRole("cell", { name: "Title" });
		this.statusColumn = page.getByRole("cell", { name: "Status" });
		this.dueDateColumn = page.getByRole("cell", { name: "Due Date" });
		this.createdColumn = page.getByRole("cell", { name: "Created" });
		this.lastUpdatedColumn = page.getByRole("cell", {
			name: "Last Updated",
		});
	}

	/**
	 * Get the Add New button
	 */
	getAddNewButton(): Locator {
		return this.addNewButton;
	}

	/**
	 * Get table column headers
	 */
	getTableColumns() {
		return {
			title: this.titleColumn,
			status: this.statusColumn,
			dueDate: this.dueDateColumn,
			created: this.createdColumn,
			lastUpdated: this.lastUpdatedColumn,
		};
	}

	/**
	 * Click the Add New button to create a task
	 */
	async clickAddNew(): Promise<void> {
		await this.addNewButton.click();
	}
}
