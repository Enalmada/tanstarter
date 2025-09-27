/**
 * Mock environment configuration for Storybook
 * Provides safe defaults so components can render without real env vars
 */

// Mock the env object that components might import
export default {
	// Shared vars
	NODE_ENV: "development",
	APP_ENV: "development",
	PUBLIC_APP_URL: "http://localhost:6006",

	// Fly.io preset vars (from envin)
	FLY_APP_NAME: "storybook-app",
	FLY_MACHINE_ID: "mock-machine",
	FLY_ALLOC_ID: "mock-alloc",
	FLY_REGION: "local",
	FLY_PUBLIC_IP: "127.0.0.1",
	FLY_IMAGE_REF: "registry.fly.io/storybook:mock",
	FLY_MACHINE_VERSION: "mock-version",
	FLY_PRIVATE_IP: "127.0.0.1",
	FLY_PROCESS_GROUP: "app",
	FLY_VM_MEMORY_MB: "512",
	PRIMARY_REGION: "local",

	// Server vars (shouldn't be used in stories, but just in case)
	GOOGLE_CLIENT_ID: "mock-google-client-id",
	GOOGLE_CLIENT_SECRET: "mock-google-client-secret",
	DATABASE_URL: "postgres://mock:mock@localhost:5432/mock",
	BETTER_AUTH_SECRET: "mock-secret-for-storybook",

	// Client vars
	PUBLIC_ROLLBAR_ACCESS_TOKEN: "mock-rollbar-token",
	PUBLIC_POSTHOG_API_KEY: "mock-posthog-key",

	// Other optional vars
	DB_RETRY_INTERVAL: 1000,
	DB_MAX_RETRIES: 3,
	AXIOM_DATASET_NAME: "mock-dataset",
	AXIOM_TOKEN: "mock-axiom-token",
	ROLLBAR_SERVER_TOKEN: "mock-rollbar-server-token",
};
