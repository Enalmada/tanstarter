import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
export const Route = createFileRoute("/health")({
	server: {
		handlers: {
			GET: async () => {
				return json({
					status: "ok",
					timestamp: new Date().toISOString(),
					uptime: process.uptime(),
				});
			},
		},
	},
});
