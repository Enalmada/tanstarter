import { Trans, useLingui } from "@lingui/react/macro";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { maxLength, minLength, parse, pipe, string } from "valibot";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "~/lib/auth/password-policy";
import authClient from "~/utils/auth-client";

// Where the emailed link lands (see RESET_PASSWORD_PATH): better-auth has already checked the token and adds
// ?token= when it is good or ?error=INVALID_TOKEN when it is not. Public rather than `_guest`, so a visitor who is
// signed in keeps the token instead of being redirected away.
export const Route = createFileRoute("/reset-password")({
	validateSearch: (search: Record<string, unknown>): { token?: string | undefined; error?: string | undefined } => ({
		token: typeof search.token === "string" ? search.token : undefined,
		error: typeof search.error === "string" ? search.error : undefined,
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token, error: linkError } = Route.useSearch();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
			<div className="container max-w-md mx-auto px-4">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">
						<Trans>Choose a new password</Trans>
					</h1>
				</div>

				<Card className="mt-8 gap-0 p-6 ring-0 border-0 bg-white dark:bg-gray-800 shadow-md">
					{token && !linkError ? <ResetPasswordForm token={token} /> : <InvalidLink />}
				</Card>
			</div>
		</div>
	);
}

function InvalidLink() {
	return (
		<div role="alert" className="space-y-4 text-center">
			<p className="text-sm text-destructive-strong">
				<Trans>This link has expired or is no longer valid.</Trans>
			</p>
			<Link
				to="/forgot-password"
				search={{ redirect: undefined }}
				className="text-sm text-foreground underline hover:no-underline"
			>
				<Trans>Send a new link</Trans>
			</Link>
		</div>
	);
}

function ResetPasswordForm({ token }: { token: string }) {
	const { t } = useLingui();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLinkInvalid, setIsLinkInvalid] = useState(false);
	const [isDone, setIsDone] = useState(false);

	const form = useForm({
		defaultValues: { password: "", confirmPassword: "" },
		onSubmit: async ({ value }) => {
			setIsLoading(true);
			setError(null);
			try {
				const result = await authClient.resetPassword({ newPassword: value.password, token });
				if (result.error) {
					if (result.error.code === "INVALID_TOKEN") {
						setIsLinkInvalid(true);
					} else if (result.error.code === "PASSWORD_TOO_SHORT" || result.error.code === "PASSWORD_TOO_LONG") {
						setError(t`Use between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`);
					} else {
						setError(t`We couldn't change your password. Please try again.`);
					}
					return;
				}
				setIsDone(true);
			} catch {
				setError(t`We couldn't change your password. Please try again.`);
			} finally {
				setIsLoading(false);
			}
		},
	});

	if (isLinkInvalid) {
		return <InvalidLink />;
	}

	if (isDone) {
		return (
			<div className="space-y-4 text-center" role="status">
				<p className="text-sm text-muted-foreground">
					<Trans>Your password has been changed and you were signed out everywhere. Sign in with the new one.</Trans>
				</p>
				<Link
					to="/signin"
					search={{ redirect: undefined }}
					className="text-sm text-foreground underline hover:no-underline"
				>
					<Trans>Go to sign in</Trans>
				</Link>
			</div>
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				void form.handleSubmit();
			}}
			className="space-y-4"
		>
			<form.Field
				name="password"
				validators={{
					onChange: ({ value }) => {
						try {
							parse(
								pipe(
									string(),
									minLength(MIN_PASSWORD_LENGTH, t`Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
									maxLength(MAX_PASSWORD_LENGTH, t`Password must be at most ${MAX_PASSWORD_LENGTH} characters`),
								),
								value,
							);
							return undefined;
						} catch (err) {
							return err instanceof Error ? err.message : t`Invalid password`;
						}
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							<Trans>New password</Trans>
						</Label>
						<Input
							id={field.name}
							name={field.name}
							type="password"
							autoComplete="new-password"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder={t`Choose a password (${MIN_PASSWORD_LENGTH}+ characters)`}
							disabled={isLoading}
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive-strong">{field.state.meta.errors[0]}</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field
				name="confirmPassword"
				validators={{
					onChangeListenTo: ["password"],
					onChange: ({ value, fieldApi }) =>
						value === fieldApi.form.getFieldValue("password") ? undefined : t`The passwords don't match`,
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							<Trans>Confirm new password</Trans>
						</Label>
						<Input
							id={field.name}
							name={field.name}
							type="password"
							autoComplete="new-password"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
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
				{isLoading ? <Trans>Saving...</Trans> : <Trans>Change password</Trans>}
			</Button>
		</form>
	);
}
