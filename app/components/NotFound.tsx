/**
 * 404 Not Found page component
 * Displays when routes don't match any defined paths
 * Includes navigation back to home
 */

import { Button, Group, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<Stack className="p-4" gap="sm">
			<Text>The page you are looking for does not exist.</Text>
			<Group>
				<Button onClick={() => window.history.back()}>Go back</Button>
				<Button component={Link} to="/" variant="outline">
					Home
				</Button>
			</Group>
		</Stack>
	);
}
