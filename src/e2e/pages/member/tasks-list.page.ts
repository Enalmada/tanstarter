import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Member Tasks List Page Object
 *
 * Encapsulates interactions with the member tasks list page.
 * Provides methods for viewing tasks and navigating to create new tasks.
 */
export class MemberTasksListPage extends BasePage {
	protected readonly path = "/tasks";

	// Locators
	private readonly newTaskLink: Locator;
	private readonly emptyStateText: Locator;

	constructor(page: Page) {
		super(page);
		this.newTaskLink = page.getByRole("link", { name: /new/i });

		// Empty state can have various text patterns
		const emptyStatePatterns = [/no tasks/i, /create.*first task/i, /get started/i, /nothing here/i, /empty/i];
		this.emptyStateText = page.getByText(new RegExp(emptyStatePatterns.map((p) => p.source).join("|"), "i"));
	}

	/**
	 * Get the New Task link
	 */
	getNewTaskLink(): Locator {
		return this.newTaskLink;
	}

	/**
	 * Get empty state text
	 */
	getEmptyStateText(): Locator {
		return this.emptyStateText;
	}

	/**
	 * Click the New Task link
	 */
	async clickNewTask(): Promise<void> {
		await this.newTaskLink.click();
	}
}
