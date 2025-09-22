import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId } from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
	title: "UI/Card",
	component: Card,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
	render: () => (
		<Card className="w-[350px]">
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>Card Description</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Card Content</p>
			</CardContent>
		</Card>
	),
};

export const WithFooter: Story = {
	render: () => (
		<Card className="w-[350px]">
			<CardHeader>
				<CardTitle>Create project</CardTitle>
				<CardDescription>Deploy your new project in one-click.</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Your new project will be created in your organization.</p>
			</CardContent>
			<CardFooter className="flex justify-between">
				<Button variant="ghost">Cancel</Button>
				<Button>Deploy</Button>
			</CardFooter>
		</Card>
	),
};

function LoginFormComponent() {
	const emailId = useId();
	const passwordId = useId();

	return (
		<Card className="w-[350px]">
			<CardHeader>
				<CardTitle>Login</CardTitle>
				<CardDescription>Enter your credentials to continue.</CardDescription>
			</CardHeader>
			<CardContent>
				<form>
					<div className="grid w-full items-center gap-4">
						<div className="flex flex-col space-y-1.5">
							<label htmlFor={emailId}>Email</label>
							<input id={emailId} type="email" />
						</div>
						<div className="flex flex-col space-y-1.5">
							<label htmlFor={passwordId}>Password</label>
							<input id={passwordId} type="password" />
						</div>
					</div>
				</form>
			</CardContent>
			<CardFooter>
				<Button className="w-full">Sign in</Button>
			</CardFooter>
		</Card>
	);
}

export const LoginForm: Story = {
	render: () => <LoginFormComponent />,
};
