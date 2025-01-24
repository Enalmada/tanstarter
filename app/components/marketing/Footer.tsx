import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="@auto dark:bg-neutral-900 border-t mt-16">
			<div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
				<div>
					<h3 className="text-lg font-semibold mb-4">Legal</h3>
					<ul className="space-y-2">
						<li>
							<Link
								to="/terms"
								className="text-neutral-600 dark:text-neutral-300 hover:text-primary"
							>
								Terms
							</Link>
						</li>
						<li>
							<Link
								to="/privacy"
								className="text-neutral-600 dark:text-neutral-300 hover:text-primary"
							>
								Privacy
							</Link>
						</li>
					</ul>
				</div>
			</div>

			<div className="border-t py-4 text-center text-sm text-neutral-500">
				© {new Date().getFullYear()} TodoApp. All rights reserved.
			</div>
		</footer>
	);
}
