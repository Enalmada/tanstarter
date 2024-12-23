import { createAPIFileRoute } from "@tanstack/start/api";
import { generateCodeVerifier, generateState } from "arctic";
import { setCookie, setHeader } from "vinxi/http";

import { envHelpers } from "~/env";
import { google } from "~/server/auth";

export const APIRoute = createAPIFileRoute("/api/auth/google")({
	GET: async () => {
		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		const url = google.createAuthorizationURL(state, codeVerifier, [
			"openid",
			"profile",
			"email",
		]);

		setCookie("google_oauth_state", state, {
			path: "/",
			secure: envHelpers.isProduction(),
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: "lax",
		});
		setCookie("google_code_verifier", codeVerifier, {
			path: "/",
			secure: envHelpers.isProduction(),
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: "lax",
		});

		setHeader("Location", url.toString());

		return new Response(null, {
			status: 302,
		});
	},
});
