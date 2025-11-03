import type { Locator } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Marketing Home Page Object
 *
 * Encapsulates interactions with the public marketing/home page.
 * Provides methods for accessing marketing content and navigation.
 */
export class MarketingPage extends BasePage {
	protected readonly path = "/";

	/**
	 * Get the main heading
	 */
	getMainHeading(): Locator {
		return this.page.getByRole("heading", {
			name: /TanStarter/i,
			level: 1,
		});
	}

	/**
	 * Get the marketing text
	 */
	getMarketingText(): Locator {
		return this.page.getByText(/A modern, type-safe/i);
	}

	/**
	 * Get the Get Started link
	 */
	getGetStartedLink(): Locator {
		return this.page.getByRole("link", {
			name: /Get Started/i,
		});
	}

	/**
	 * Get the GitHub link
	 */
	getGithubLink(): Locator {
		return this.page.getByRole("link", {
			name: /View on GitHub/i,
		});
	}

	/**
	 * Get the Features heading
	 */
	getFeaturesHeading(): Locator {
		return this.page.getByRole("heading", { name: /Features/i });
	}

	/**
	 * Click the Get Started link and wait for navigation
	 */
	async clickGetStarted(): Promise<void> {
		await this.getGetStartedLink().click();
		await this.waitForPageLoad();
	}

	/**
	 * Verify the page title contains TanStarter
	 */
	async hasTanStarterTitle(): Promise<boolean> {
		const title = await this.getTitle();
		return title.includes("TanStarter");
	}
}
