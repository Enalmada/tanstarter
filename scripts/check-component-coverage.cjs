#!/usr/bin/env node

/**
 * Check for components missing Storybook coverage
 * Adapted for single src root structure
 */

const fs = require("node:fs");
const path = require("node:path");

// Find all component files
function findComponents(dir, components = []) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory() && !file.startsWith("__")) {
			findComponents(fullPath, components);
		} else if (file.endsWith(".tsx") && !file.includes(".test.") && !file.includes(".stories.")) {
			// Check if this looks like a component (starts with capital letter or is index.tsx)
			if (file[0] === file[0].toUpperCase() || file === "index.tsx") {
				// Skip certain patterns that typically don't need stories
				const skipPatterns = ["Layout.tsx", "CatchBoundary.tsx", "ErrorBoundary.tsx", "Error.tsx"];

				const shouldSkip = skipPatterns.some((pattern) => file.includes(pattern));
				if (!shouldSkip) {
					components.push(fullPath);
				}
			}
		}
	}

	return components;
}

// Find all story files
function findStories(dirs, stories = []) {
	for (const dir of dirs) {
		if (!fs.existsSync(dir)) continue;

		const files = fs.readdirSync(dir);

		for (const file of files) {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				findStories([fullPath], stories);
			} else if (file.endsWith(".stories.tsx") || file.endsWith(".stories.ts")) {
				stories.push(fullPath);
			}
		}
	}

	return stories;
}

// Extract component name from path
function getComponentName(componentPath) {
	const fileName = path.basename(componentPath, ".tsx");
	if (fileName === "index") {
		return path.basename(path.dirname(componentPath));
	}
	return fileName;
}

// Find page files (routes)
function findPages(pageDirs) {
	const pages = [];

	pageDirs.forEach((pageDir) => {
		if (!fs.existsSync(pageDir)) return;

		const files = fs.readdirSync(pageDir);

		for (const file of files) {
			const fullPath = path.join(pageDir, file);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Recursively search subdirectories
				pages.push(...findPages([fullPath]));
			} else if (
				file.endsWith(".tsx") &&
				(file.includes("Page") ||
					file === "route.tsx" ||
					file.startsWith("index.") ||
					file === "new.tsx" ||
					file.startsWith("$")) &&
				!file.includes(".test.") &&
				!file.includes(".stories.")
			) {
				pages.push(fullPath);
			}
		}
	});

	return pages;
}

// Find email template files
function findEmails(emailDir) {
	const emails = [];

	if (!fs.existsSync(emailDir)) return emails;

	const files = fs.readdirSync(emailDir);

	for (const file of files) {
		const fullPath = path.join(emailDir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
		} else if (
			file.endsWith(".tsx") &&
			file.endsWith("Email.tsx") &&
			!file.includes(".test.") &&
			!file.includes(".stories.")
		) {
			emails.push(fullPath);
		}
	}

	return emails;
}

// Main coverage check function
function checkCoverage() {
	// Find components in src/components
	const componentDir = "src/components";
	const components = findComponents(componentDir);

	// Find email templates in src/emails
	const emailDir = "src/emails";
	const emails = findEmails(emailDir);

	// Check if --include-routes flag is provided
	const includeRoutes = process.argv.includes("--include-routes");
	let pages = [];

	if (includeRoutes) {
		// Find pages in src/routes (TanStack Router structure) - only when explicitly requested
		const routeDir = "src/routes";
		pages = findPages([routeDir]);
	} else {
	}

	const allItems = [...components, ...pages, ...emails];

	// Look for stories in the src directory
	const storyDirs = [
		"src/components", // Component stories
		"src/routes", // Route/page stories
		"src/emails", // Email template stories
		"src/storybook", // Centralized stories (if any)
	];
	const stories = findStories(storyDirs);

	// Create map of story names
	const storyMap = new Set();
	stories.forEach((storyPath) => {
		const base = path.basename(storyPath, path.extname(storyPath)).replace(".stories", "");
		const parent = path.basename(path.dirname(storyPath));

		// Simple key for backward compatibility
		storyMap.add(base);

		// Handle '-' prefix for route stories (TanStack Router routeFileIgnorePrefix)
		// If story name starts with '-', also add version without '-' prefix
		if (base.startsWith("-")) {
			const baseWithoutPrefix = base.substring(1);
			storyMap.add(baseWithoutPrefix);
			// Also add disambiguated version without prefix
			storyMap.add(`${parent}/${baseWithoutPrefix}`);
			// For route index files, also add the parent name as the component name
			if (baseWithoutPrefix === "index") {
				storyMap.add(parent);
			}
		}

		// Disambiguated key for nested components
		storyMap.add(`${parent}/${base}`);
	});

	const missing = [];
	const covered = [];

	allItems.forEach((itemPath) => {
		const itemName = getComponentName(itemPath);
		const relativePath = path.relative("src", itemPath);

		const isPage = itemPath.includes("/routes/") || itemName.includes("Page");
		const isEmail = itemPath.includes("/emails/") && itemName.endsWith("Email");

		let displayName = itemName;
		if (isPage) displayName = `${itemName} (page)`;
		else if (isEmail) displayName = `${itemName} (email)`;

		// Create disambiguated key for this component/page
		const parent = path.basename(path.dirname(itemPath));
		const disambiguatedName = `${parent}/${itemName}`;

		// Check both simple name and disambiguated name for coverage
		if (storyMap.has(itemName) || storyMap.has(disambiguatedName)) {
			covered.push({ name: displayName, path: relativePath });
		} else {
			missing.push({ name: displayName, path: relativePath });
		}
	});
	if (covered.length > 0 && process.argv.includes("--verbose")) {
		covered.forEach((item) => {});
	}
	if (missing.length > 0) {
		missing.forEach((item) => {});
	}

	const _coverage = allItems.length > 0 ? Math.round((covered.length / allItems.length) * 100) : 100;

	return {
		covered: covered.length,
		missing: missing.length,
		total: allItems.length,
	};
}

// Main execution
const stats = checkCoverage();

const _coverage = stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 100;
const _itemType = process.argv.includes("--include-routes") ? "components/pages/emails" : "components/emails";

// Check for --quiet flag to suppress success output
const isQuiet = process.argv.includes("--quiet");

if (stats.missing > 0) {
	// Exit with error when stories are missing
	process.exit(1);
} else {
	// Only show detailed output if not in quiet mode
	if (!isQuiet) {
	}
	process.exit(0);
}
