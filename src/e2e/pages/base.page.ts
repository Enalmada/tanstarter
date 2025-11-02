import type { Page } from "@playwright/test";

/**
 * Base Page Object
 *
 * Common functionality shared across all page objects.
 * Provides standardized navigation, waiting, and interaction methods.
 *
 * Best Practices:
 * - Use semantic locators (getByRole, getByLabel, etc.)
 * - Avoid hardcoded timeouts; use smart waiting
 * - Encapsulate all page interactions
 * - Keep tests focused on business logic
 */
export abstract class BasePage {
	protected readonly page: Page;
	protected abstract readonly path: string;

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Navigate to this page and wait for it to be ready
	 */
	async goto(): Promise<void> {
		await this.page.goto(this.path);
		await this.waitForPageLoad();
	}

	/**
	 * Wait for page to be fully loaded
	 * Waits for both DOM and network to be idle
	 */
	async waitForPageLoad(): Promise<void> {
		await this.page.waitForLoadState("domcontentloaded");
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Wait for loading spinner to disappear
	 * Common pattern for TanStack Start apps
	 */
	async waitForLoadingComplete(): Promise<void> {
		try {
			await this.page.waitForSelector("[role='progressbar']", {
				state: "detached",
				timeout: 5000,
			});
		} catch {
			// Loading spinner may not appear for fast responses
		}
	}

	/**
	 * Navigate to page and wait for loading to complete
	 * Combines goto, page load, and spinner wait
	 */
	async gotoAndWaitForReady(): Promise<void> {
		await this.page.goto(this.path);
		await this.waitForPageLoad();
		await this.waitForLoadingComplete();
	}

	/**
	 * Get the current page title
	 */
	async getTitle(): Promise<string> {
		return this.page.title();
	}

	/**
	 * Get the current URL
	 */
	getUrl(): string {
		return this.page.url();
	}

	/**
	 * Check if current URL matches expected path
	 */
	isOnPage(urlPattern: string | RegExp): boolean {
		if (typeof urlPattern === "string") {
			return this.page.url().includes(urlPattern);
		}
		return urlPattern.test(this.page.url());
	}

	/**
	 * Check if element is visible
	 */
	async isVisible(selector: string): Promise<boolean> {
		return this.page.locator(selector).isVisible();
	}

	/**
	 * Get main content area
	 */
	getMainContent() {
		return this.page.getByRole("main");
	}

	/**
	 * Get form element
	 */
	getForm() {
		return this.page.locator("form");
	}

	/**
	 * Wait for URL to match pattern
	 * Useful after form submissions or navigation
	 */
	async waitForUrl(urlPattern: string | RegExp): Promise<void> {
		await this.page.waitForURL(urlPattern);
	}
}
