import "@mantine/core/styles.css";
import "./main.css";
import { MantineProvider, createTheme } from "@mantine/core";
import type { Preview } from "@storybook/react";

const theme = createTheme({
	// Add your theme customizations here
});

const preview: Preview = {
	parameters: {
		actions: { argTypesRegex: "^on[A-Z].*" },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
		layout: "centered",
		themes: {
			default: "light",
			list: [
				{ name: "light", class: "light", color: "#ffffff" },
				{ name: "dark", class: "dark", color: "#000000" },
			],
		},
	},
	decorators: [
		(Story) => (
			<MantineProvider theme={theme}>
				<div className="p-4">
					<Story />
				</div>
			</MantineProvider>
		),
	],
};

export default preview;
