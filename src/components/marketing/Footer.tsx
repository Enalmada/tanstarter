import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="border-t bg-gray-200 dark:bg-gray-800">
			<div className="container mx-auto flex flex-col items-center justify-center py-10">
				<div className="mb-8 flex justify-center gap-8">
					<Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
						Terms
					</Link>
					<Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
						Privacy
					</Link>
				</div>

				<div className="w-full border-t border-neutral-200 dark:border-neutral-800 pt-6">
					<p className="text-center text-sm text-muted-foreground">
						© {new Date().getFullYear()} TodoApp. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
