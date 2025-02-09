import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

interface ServerGuardOptions {
	serverDirectory?: string[];
	allowedImports?: string[];
	onError?: (message: string) => void;
	clientEntryPoints?: string[];
}

export function serverGuard(options: ServerGuardOptions = {}): Plugin {
	const {
		serverDirectory = ["app/server", "app/lib/auth", "app/config"],
		allowedImports = [],
		onError = (message: string) => {
			throw new Error(message);
		},
		clientEntryPoints = ["app/client.tsx", "app/root.tsx"],
	} = options;

	const serverDirs = serverDirectory.map((dir) =>
		path.resolve(process.cwd(), dir),
	);
	const resolvedClientEntryPoints = clientEntryPoints.map((entry) =>
		path.resolve(process.cwd(), entry),
	);

	return {
		name: "server-guard",
		enforce: "pre",
		apply: "serve",

		resolveId(source, importer, options) {
			if (!importer) return;

			const isClientFile = isClientCode(importer);
			const isServerAuthImport =
				source.includes("/server/auth/") ||
				(source.includes("better-auth/") &&
					!source.includes("better-auth/client") &&
					!source.includes("better-auth/react") &&
					!source.includes("better-auth/client/plugins"));

			// Only block and log actual server imports
			if (isClientFile && isServerAuthImport) {
				console.info("\n[Server Guard Warning] Client importing server auth:");
				console.info("  Source:", source);
				console.info(
					"  Normalized Source:",
					path.resolve(process.cwd(), source),
				);
				console.info("  Importer:", importer);
				console.info(
					"  Stack:",
					new Error().stack?.split("\n").slice(2).join("\n"),
				);

				// Block only server imports
				return { id: source, external: true };
			}

			const normalizedSource = source.startsWith(".")
				? path.resolve(path.dirname(importer), source)
				: path.resolve(process.cwd(), source);

			if (source.startsWith("~")) {
				const resolvedSource = path.resolve(process.cwd(), source.slice(2));
				return checkImport(resolvedSource, importer);
			}

			if (
				(source.startsWith(".") || source.startsWith("/")) &&
				!source.endsWith(".css")
			) {
				return checkImport(normalizedSource, importer);
			}

			if (source.includes("server") || source.includes("auth")) {
				return checkImport(source, importer);
			}

			return;

			function checkImport(resolvedSource: string, importer: string) {
				if (
					allowedImports.some((allowedPath) =>
						resolvedSource.includes(path.resolve(process.cwd(), allowedPath)),
					)
				) {
					return;
				}

				if (isClientCode(importer)) {
					const isServerImport = serverDirs.some((dir) =>
						resolvedSource.includes(dir),
					);

					if (isServerImport) {
						const importerContent = fs.readFileSync(importer, "utf-8");
						const typeOnlyImportRegex = new RegExp(
							`import\\s+type\\s+\\{[^}]*\\}\\s+from\\s+['"]${source.replace(
								/[.*+?^${}()|[\]\\]/g,
								"\\$&",
							)}['"]`,
						);

						if (typeOnlyImportRegex.test(importerContent)) {
							return;
						}

						const relativeSource = path.relative(process.cwd(), resolvedSource);
						const relativeImporter = path.relative(process.cwd(), importer);
						onError(
							`Server guard violation: Client file '${relativeImporter}' is importing from server file '${relativeSource}'. Only type imports are allowed.`,
						);
						return { id: resolvedSource, external: true };
					}
				}
			}
		},
	};

	function isClientCode(filePath: string): boolean {
		const normalizedPath = filePath.replace(/\\/g, "/");

		if (resolvedClientEntryPoints.includes(filePath)) {
			return true;
		}

		if (
			(normalizedPath.includes("/routes/") ||
				normalizedPath.includes("/components/")) &&
			!normalizedPath.includes("/server/")
		) {
			return true;
		}

		if (normalizedPath.includes("/__tests__/")) {
			return true;
		}

		if (
			normalizedPath.includes("/client/") ||
			normalizedPath.includes("/hooks/") ||
			normalizedPath.includes("/utils/")
		) {
			return true;
		}

		return false;
	}
}
