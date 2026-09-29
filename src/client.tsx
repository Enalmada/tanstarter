/**
 * Client-side application entry point
 * Renders the app and handles hydration.
 *
 * The language is not chosen here: the server resolves it per request and the
 * router hydrates it from the page (src/lib/i18n/router-plugin.tsx), so the
 * first client render matches the server HTML.
 */

import { StartClient } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";

// PostHog (analytics + exception autocapture) as early as possible, without
// holding up hydration or putting posthog-js in the main chunk.
import("~/lib/monitoring/client").then((mod) => mod.initPosthog()).catch(() => {});

hydrateRoot(document, <StartClient />);
