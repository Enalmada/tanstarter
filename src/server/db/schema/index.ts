/**
 * Schema index file
 * Exports all database schema definitions and relations
 * This file centralizes all database schema imports for easy access
 */

// Re-export everything from each schema
// biome-ignore lint/performance/noBarrelFile: We need these for convenient schema access across the app
export * from "./auth.schema";
export * from "./task.schema";
