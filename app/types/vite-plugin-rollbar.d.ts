declare module "vite-plugin-rollbar" {
	interface RollbarPluginOptions {
		accessToken: string;
		version: string;
		baseUrl: string;
		silent?: boolean;
		ignoreUploadErrors?: boolean;
		rollbarEndpoint?: string;
		base?: string;
		outputDir?: string;
	}

	export default function rollbarSourcemaps(
		options: RollbarPluginOptions,
	): import("vite").Plugin;
}
