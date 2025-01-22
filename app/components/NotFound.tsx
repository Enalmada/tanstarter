/**
 * 404 Not Found page component
 * Displays when routes don't match any defined paths
 * Includes navigation back to home
 */

import { Button } from "~/components/ui/Button";
import { Group } from "~/components/ui/Group";
import { LinkButton } from "~/components/ui/LinkButton";
import { Stack } from "~/components/ui/Stack";
import { Text } from "~/components/ui/Text";

export function NotFound() {
	return (
		<Stack className="p-4" gap="sm">
			<Text>The page you are looking for does not exist.</Text>
			<Group>
				<Button onClick={() => window.history.back()}>Go back</Button>
				<LinkButton to="/" variant="outline">
					Home
				</LinkButton>
			</Group>
		</Stack>
	);
}
