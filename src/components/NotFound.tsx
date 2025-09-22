/**
 * 404 Not Found page component
 * Displays when routes don't match any defined paths
 * Includes navigation back to home
 */

import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export function NotFound() {
	return (
		<div className="flex flex-col gap-4 p-4">
			<p className="text-muted-foreground">The page you are looking for does not exist.</p>
			<div className="flex gap-4">
				<Button onClick={() => window.history.back()}>Go back</Button>
				<Button variant="outline" asChild>
					<Link to="/">Home</Link>
				</Button>
			</div>
		</div>
	);
}
