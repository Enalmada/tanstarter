/// <reference types="vite/client" />

declare module "*.css?url" {
	const content: string;
	export default content;
}

// Lingui .po files
declare module "*.po" {
	interface Messages {
		[key: string]: string;
	}
	export const messages: Messages;
}
