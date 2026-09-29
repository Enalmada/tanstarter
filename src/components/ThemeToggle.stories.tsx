import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import ThemeToggle from "./ThemeToggle";
import { ThemeProvider } from "./theme-provider";

const meta: Meta<typeof ThemeToggle> = {
	title: "Components/ThemeToggle",
	component: ThemeToggle,
	decorators: [
		(Story) => (
			<ThemeProvider>
				<Story />
			</ThemeProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ChooseDark: Story = {
	play: async ({ canvasElement }) => {
		await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle theme" }));
		// The menu renders in a portal, outside the story canvas
		await userEvent.click(await within(document.body).findByRole("menuitemradio", { name: "Dark" }));
		await expect(document.documentElement.classList.contains("dark")).toBe(true);
		await expect(document.documentElement.style.colorScheme).toBe("dark");
	},
};
