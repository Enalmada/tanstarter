import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId } from "react";
import { Button } from "./button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";

const meta = {
	title: "UI/Dialog",
	component: Dialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultDialogComponent() {
	const nameId = useId();
	const usernameId = useId();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Open Dialog</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit profile</DialogTitle>
					<DialogDescription>
						Make changes to your profile here. Click save when you're done.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<label htmlFor={nameId} className="text-right">
							Name
						</label>
						<input
							id={nameId}
							className="col-span-3"
							defaultValue="Pedro Duarte"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<label htmlFor={usernameId} className="text-right">
							Username
						</label>
						<input
							id={usernameId}
							className="col-span-3"
							defaultValue="@peduarte"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="submit">Save changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const Default: Story = {
	render: () => <DefaultDialogComponent />,
};

function WithFormComponent() {
	const nameId = useId();
	const emailId = useId();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Edit Profile</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit profile</DialogTitle>
					<DialogDescription>
						Make changes to your profile here. Click save when you're done.
					</DialogDescription>
				</DialogHeader>
				<form className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<label htmlFor={nameId} className="text-right">
							Name
						</label>
						<input id={nameId} className="col-span-3" />
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<label htmlFor={emailId} className="text-right">
							Email
						</label>
						<input id={emailId} type="email" className="col-span-3" />
					</div>
					<DialogFooter>
						<Button type="submit">Save changes</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export const WithForm: Story = {
	render: () => <WithFormComponent />,
};
