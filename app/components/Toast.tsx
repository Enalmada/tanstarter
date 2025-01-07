import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";

interface ToastProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description: string;
	type: "error" | "success" | "info" | "warning";
}

export function Toast({
	isOpen,
	onClose,
	title,
	description,
	type,
}: ToastProps) {
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size="sm"
			placement="top"
			className={`${type === "error" ? "bg-danger" : "bg-primary"} text-white`}
		>
			<ModalContent>
				<ModalHeader>{title}</ModalHeader>
				<ModalBody>
					<p>{description}</p>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
