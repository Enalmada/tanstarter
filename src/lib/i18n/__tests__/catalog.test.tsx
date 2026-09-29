import { setupI18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Plural, Trans } from "@lingui/react/macro";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages as en } from "~/locales/en/messages.po";
import { messages as es } from "~/locales/es/messages.po";

function renderWith(locale: "en" | "es", ui: React.ReactNode) {
	const i18n = setupI18n({ locale, messages: { en, es } });
	return render(<I18nProvider i18n={i18n}>{ui}</I18nProvider>);
}

// Same variable name as the index page so the message id matches the extracted catalog
const FEATURE_COUNT = 3;

const Sample = () => (
	<>
		<Trans>Get Started</Trans>
		<Plural value={FEATURE_COUNT} one="# feature" other="# features" />
	</>
);

describe("compiled catalogs", () => {
	it("renders English source strings and plural forms", () => {
		renderWith("en", <Sample />);
		expect(screen.getByText(/Get Started/)).toBeInTheDocument();
		expect(screen.getByText(/3 features/)).toBeInTheDocument();
	});

	it("renders the Spanish translation and plural forms", () => {
		renderWith("es", <Sample />);
		expect(screen.getByText(/Empezar/)).toBeInTheDocument();
		expect(screen.getByText(/3 características/)).toBeInTheDocument();
	});
});
