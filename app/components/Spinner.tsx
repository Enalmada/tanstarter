import { Spinner as NextUISpinner } from "@nextui-org/react";

export function Spinner() {
	return (
		<NextUISpinner
			size="sm"
			classNames={{
				wrapper: "w-4 h-4",
			}}
		/>
	);
}
