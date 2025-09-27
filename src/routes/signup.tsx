import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useId, useState } from "react";
import { email, minLength, parse, pipe, string } from "valibot";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import authClient from "~/utils/auth-client";

function GoogleIcon(props: React.ComponentPropsWithoutRef<"svg">) {
	const titleId = useId();
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="xMidYMid"
			viewBox="0 0 256 262"
			className="w-4 h-4"
			role="img"
			aria-labelledby={titleId}
			{...props}
		>
			<title id={titleId}>Google Logo</title>
			<path
				fill="#4285F4"
				d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
			/>
			<path
				fill="#34A853"
				d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
			/>
			<path
				fill="#FBBC05"
				d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
			/>
			<path
				fill="#EB4335"
				d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
			/>
		</svg>
	);
}

function GoogleButton(props: React.ComponentPropsWithoutRef<"button">) {
	return (
		<Button variant="outline" {...props}>
			<GoogleIcon className="mr-2" />
			{props.children}
		</Button>
	);
}

export const Route = createFileRoute("/signup")({
	component: SignupLayout,
	beforeLoad: async ({ context }) => {
		if (context.user) {
			throw redirect({
				to: "/tasks",
			});
		}
	},
});

function SignupLayout() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
			<AuthPage />
		</div>
	);
}

function SignupForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isUserExists, setIsUserExists] = useState(false);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			try {
				setIsLoading(true);
				setError(null);
				setIsUserExists(false);

				const result = await authClient.signUp.email({
					email: value.email,
					password: value.password,
					name: value.email.split("@")[0], // Use email prefix as default name
					callbackURL: "/tasks",
				});

				// Check if the result contains an error
				if (result && typeof result === "object" && "error" in result && result.error) {
					// Better Auth returns errors in result.error, not as thrown exceptions
					const error = result.error as { message?: string; code?: string };
					throw new Error(error.message || error.code || "Sign up failed");
				}

				// Successful signup - loading state will be handled by redirect
			} catch (err) {
				setIsLoading(false);

				// Handle specific error cases
				if (err instanceof Error) {
					const errorMessage = err.message.toLowerCase();

					// Check for "user already exists" error patterns
					if (
						errorMessage.includes("user already exists") ||
						errorMessage.includes("email already exists") ||
						errorMessage.includes("user exists") ||
						errorMessage.includes("email is already registered")
					) {
						setError("An account with this email already exists.");
						setIsUserExists(true);
					} else {
						setError(err.message);
					}
				} else {
					setError("Sign up failed. Please try again.");
				}
			}
		},
	});

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
				name="email"
				validators={{
					onChange: ({ value }) => {
						try {
							parse(pipe(string(), email()), value);
							return undefined;
						} catch {
							return "Please enter a valid email address";
						}
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Email</Label>
						<Input
							id={field.name}
							name={field.name}
							type="email"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Enter your email"
							disabled={isLoading}
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field
				name="password"
				validators={{
					onChange: ({ value }) => {
						try {
							parse(pipe(string(), minLength(8, "Password must be at least 8 characters")), value);
							return undefined;
						} catch (err) {
							return err instanceof Error ? err.message : "Invalid password";
						}
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Password</Label>
						<Input
							id={field.name}
							name={field.name}
							type="password"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Enter your password (8+ characters)"
							disabled={isLoading}
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
						)}
					</div>
				)}
			</form.Field>

			{error && (
				<div className="rounded-md bg-destructive/15 p-3 text-sm">
					<p className="text-destructive">{error}</p>
					{isUserExists && (
						<p className="mt-2 text-muted-foreground">
							Already have an account?{" "}
							<Link to="/signin" className="text-foreground underline hover:no-underline">
								Sign in here
							</Link>
						</p>
					)}
				</div>
			)}

			<Button type="submit" className="w-full h-11" disabled={isLoading}>
				{isLoading ? (
					<>
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
						Creating account...
					</>
				) : (
					"Create account"
				)}
			</Button>

			<div className="text-center">
				<Link to="/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
					Already have an account? Sign in
				</Link>
			</div>
		</form>
	);
}

function AuthPage() {
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	return (
		<div className="container max-w-md mx-auto px-4">
			<div className="text-center">
				<h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
				<p className="text-sm text-muted-foreground mt-2">Just email and password - quick and simple</p>
			</div>

			<Card className="mt-8 p-6 border-0 bg-white dark:bg-gray-800 shadow-md">
				<SignupForm />

				<div className="relative my-6">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
					</div>
				</div>

				<GoogleButton
					className="w-full h-11"
					type="button"
					disabled={isGoogleLoading}
					onClick={async () => {
						try {
							setIsGoogleLoading(true);
							await authClient.signIn.social({
								provider: "google",
								callbackURL: "/tasks",
							});
						} catch (_error) {
							// Reset loading state if authentication fails
							setIsGoogleLoading(false);
						}
					}}
				>
					{isGoogleLoading ? "Loading..." : "Continue with Google"}
				</GoogleButton>
			</Card>
		</div>
	);
}
