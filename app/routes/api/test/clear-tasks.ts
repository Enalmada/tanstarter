import { createAPIRoute } from "@tanstack/react-start/api";
import DB from "~/server/db";
import { TaskTable } from "~/server/db/schema";

export const APIRoute = createAPIRoute("/api/test/clear-tasks")({
	POST: async () => {
		// Only allow in development
		if (process.env.NODE_ENV !== "development") {
			return new Response(null, {
				status: 403,
				statusText: "Forbidden in non-development environments",
			});
		}

		try {
			// Delete all tasks
			await DB.delete(TaskTable);

			return new Response(null, {
				status: 200,
			});
		} catch (error) {
			console.error("Failed to clear tasks:", error);
			return new Response(null, {
				status: 500,
				statusText: "Failed to clear tasks",
			});
		}
	},
});
