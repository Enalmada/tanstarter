import { Trans, useLingui } from "@lingui/react/macro";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { email, parse, pipe, string } from "valibot";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PASSWORD_RESET_LINK_MINUTES, RESET_PASSWORD_PATH } from "~/lib/auth/password-reset";
import authClient from "~/utils/auth-client";

export const Route = createFileRoute("/_guest/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const search = Route.useSearch();
	const { t } = useLingui();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [requestedFor, setRequestedFor] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			setIsLoading(true);
			setError(null);
			try {
				const result = await authClient.requestPasswordReset({ email: value.email, redirectTo: RESET_PASSWORD_PATH });
				if (result.error) {
					// The server answers the same for every address, so these say nothing about the account.
					if (result.error.code === "RESET_PASSWORD_DISABLED") {
						setError(t`Password reset isn't available right now. Please continue with Google.`);
					} else if (result.error.status === 429) {
						setError(t`Too many requests. Please wait a minute and try again.`);
					} else {
						setError(t`We couldn't send the link. Please try again.`);
					}
					return;
				}
				setRequestedFor(value.email);
			} catch {
				setError(t`We couldn't send the link. Please try again.`);
			} finally {
				setIsLoading(false);
			}
		},
	});

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
			<div className="container max-w-md mx-auto px-4">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">
						<Trans>Reset your password</Trans>
					</h1>
					<p className="text-sm text-muted-foreground mt-2">
						<Trans>We'll email you a link to choose a new one</Trans>
					</p>
				</div>

				<Card className="mt-8 gap-0 p-6 ring-0 border-0 bg-white dark:bg-gray-800 shadow-md">
					{requestedFor ? (
						<div className="space-y-4 text-center" role="status">
							<h2 className="text-lg font-semibold">
								<Trans>Check your email</Trans>
							</h2>
							<p className="text-sm text-muted-foreground">
								<Trans>
									If <span className="font-medium text-foreground">{requestedFor}</span> has an account, we sent it a
									link to choose a new password. The link works once, for {PASSWORD_RESET_LINK_MINUTES} minutes.
								</Trans>
							</p>
						</div>
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								void form.handleSubmit();
							}}
							className="space-y-4"
						>
							<form.Field
								name="email"
								validators={{
									onChange: ({ value }) => {
										try {
											parse(pipe(string(), email()), value);
											return undefined;
										} catch {
											return t`Please enter a valid email address`;
										}
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>
											<Trans>Email</Trans>
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											autoComplete="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder={t`Enter your email`}
											disabled={isLoading}
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive-strong">{field.state.meta.errors[0]}</p>
										)}
									</div>
								)}
							</form.Field>

							{error && (
								<div role="alert" className="rounded-md bg-destructive/15 p-3 text-sm">
									<p className="text-destructive-strong">{error}</p>
								</div>
							)}

							<Button type="submit" className="w-full h-11" disabled={isLoading}>
								{isLoading ? <Trans>Sending...</Trans> : <Trans>Send reset link</Trans>}
							</Button>
						</form>
					)}

					<div className="mt-4 text-center">
						<Link
							to="/signin"
							search={{ redirect: search.redirect }}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<Trans>Back to sign in</Trans>
						</Link>
					</div>
				</Card>
			</div>
		</div>
	);
}
