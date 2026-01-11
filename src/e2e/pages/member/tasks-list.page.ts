import type { Locator } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Member Tasks List Page Object
 *
 * Encapsulates interactions with the member tasks list page.
 * Provides methods for viewing tasks and navigating to create new tasks.
 */
export class MemberTasksListPage extends BasePage {
	protected readonly path = "/tasks";

	/**
	 * Get the New Task link in the main content area
	 */
	getNewTaskLink(): Locator {
		return this.page.getByRole("main").getByRole("link", { name: /new/i });
	}

	/**
	 * Get empty state text
	 */
	getEmptyStateText(): Locator {
		// Empty state can have various text patterns
		const emptyStatePatterns = [/no tasks/i, /create.*first task/i, /get started/i, /nothing here/i, /empty/i];
		return this.page.getByText(new RegExp(emptyStatePatterns.map((p) => p.source).join("|"), "i"));
	}

	/**
	 * Click the New Task link
	 */
	async clickNewTask(): Promise<void> {
		await this.getNewTaskLink().click();
	}
}
