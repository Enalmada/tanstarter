import type { Meta, StoryObj } from "@storybook/react-vite";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

const meta = {
	title: "UI/Alert",
	component: Alert,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Alert>
			<AlertTitle>Heads up!</AlertTitle>
			<AlertDescription>You can add components to your app using the cli.</AlertDescription>
		</Alert>
	),
};

export const WithIcon: Story = {
	render: () => (
		<Alert>
			<Terminal className="size-4" />
			<AlertTitle>Heads up!</AlertTitle>
			<AlertDescription>You can add components to your app using the cli.</AlertDescription>
		</Alert>
	),
};

export const Destructive: Story = {
	render: () => (
		<Alert variant="destructive">
			<Terminal className="size-4" />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>Your session has expired. Please log in again.</AlertDescription>
		</Alert>
	),
};

export const NoTitle: Story = {
	render: () => (
		<Alert>
			<AlertDescription>You can add components to your app using the cli.</AlertDescription>
		</Alert>
	),
};
