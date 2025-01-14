import { createOAuthInit } from "~/server/auth/createOAuthInit";

export const APIRoute = createOAuthInit("google", {
	scopes: ["openid", "profile", "email"],
	useCodeVerifier: true,
});
