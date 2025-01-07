/**
 * 404 Not Found page component
 * Displays when routes don't match any defined paths
 * Includes navigation back to home
 */

import { Button } from "@nextui-org/react";
import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<div className="space-y-2 p-2">
			<p>The page you are looking for does not exist.</p>
			<p className="flex flex-wrap items-center gap-2">
				<Button onClick={() => window.history.back()}>Go back</Button>
				<Button as={Link} to="/" variant="bordered">
					Home
				</Button>
			</p>
		</div>
	);
}
