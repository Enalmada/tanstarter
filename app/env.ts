export function validateEnv() {
	const required = [
		"GOOGLE_CLIENT_ID",
		"GOOGLE_CLIENT_SECRET",
		"GOOGLE_REDIRECT_URI",
	] as const;

	const missing: string[] = [];

	for (const key of required) {
		const value = process.env[key];
		if (!value || value.trim() === "") {
			missing.push(key);
		}
	}

	if (missing.length > 0) {
		throw new Error(
			`Missing or empty required environment variables:\n${missing.join("\n")}`,
		);
	}
}

validateEnv();
