import { notifications } from "@mantine/notifications";

interface ToastProps {
	title: string;
	description: string;
	type: "error" | "success" | "info" | "warning";
}

export function showToast({ title, description, type }: ToastProps) {
	notifications.show({
		title,
		message: description,
		color:
			type === "error"
				? "red"
				: type === "success"
					? "green"
					: type === "warning"
						? "yellow"
						: "blue",
	});
}
