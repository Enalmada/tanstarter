import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Marketing Home Page Object
 *
 * Encapsulates interactions with the public marketing/home page.
 * Provides methods for accessing marketing content and navigation.
 */
export class MarketingPage extends BasePage {
	protected readonly path = "/";

	// Locators
	private readonly mainHeading: Locator;
	private readonly marketingText: Locator;
	private readonly getStartedLink: Locator;
	private readonly githubLink: Locator;
	private readonly featuresHeading: Locator;

	constructor(page: Page) {
		super(page);
		this.mainHeading = page.getByRole("heading", {
			name: /TanStarter/i,
			level: 1,
		});
		this.marketingText = page.getByText(/A modern, type-safe/i);
		this.getStartedLink = page.getByRole("link", {
			name: /Get Started/i,
		});
		this.githubLink = page.getByRole("link", {
			name: /View on GitHub/i,
		});
		this.featuresHeading = page.getByRole("heading", { name: /Features/i });
	}

	/**
	 * Get the main heading
	 */
	getMainHeading(): Locator {
		return this.mainHeading;
	}

	/**
	 * Get the marketing text
	 */
	getMarketingText(): Locator {
		return this.marketingText;
	}

	/**
	 * Get the Get Started link
	 */
	getGetStartedLink(): Locator {
		return this.getStartedLink;
	}

	/**
	 * Get the GitHub link
	 */
	getGithubLink(): Locator {
		return this.githubLink;
	}

	/**
	 * Get the Features heading
	 */
	getFeaturesHeading(): Locator {
		return this.featuresHeading;
	}

	/**
	 * Click the Get Started link and wait for navigation
	 */
	async clickGetStarted(): Promise<void> {
		await this.getStartedLink.click();
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
