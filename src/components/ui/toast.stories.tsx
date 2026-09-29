import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "./button";
import { Toaster, toast } from "./toast";

const meta = {
	title: "UI/Toast",
	component: Toaster,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<>
				<Story />
				<Toaster />
			</>
		),
	],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
	render: () => (
		<Button onClick={() => toast.add({ type: "success", title: "Task created", description: "Your task was saved." })}>
			Show success
		</Button>
	),
	play: async ({ canvasElement }) => {
		await userEvent.click(within(canvasElement).getByRole("button", { name: "Show success" }));
		// Toasts render in a portal, outside the story canvas
		await expect(await within(document.body).findByText("Task created")).toBeInTheDocument();
	},
};

export const ErrorToast: Story = {
	name: "Error",
	render: () => (
		<Button
			variant="destructive"
			onClick={() => toast.add({ type: "error", title: "Something went wrong", description: "Please try again." })}
		>
			Show error
		</Button>
	),
};

export const Loading: Story = {
	render: () => (
		<Button variant="outline" onClick={() => toast.add({ type: "loading", title: "Saving…", timeout: 0 })}>
			Show loading
		</Button>
	),
};

export const WithAction: Story = {
	render: () => (
		<Button
			variant="outline"
			onClick={() =>
				toast.add({
					title: "Task deleted",
					actionProps: { children: "Undo" },
				})
			}
		>
			Show with action
		</Button>
	),
};
