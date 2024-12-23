/// <reference types="vinxi/types/client" />
import { StartClient } from "@tanstack/start";
import { hydrateRoot } from "react-dom/client";
import { createRouter } from "./router";

const router = createRouter();

function App() {
	return <StartClient router={router} />;
}

hydrateRoot(document, <App />);

export default App;
