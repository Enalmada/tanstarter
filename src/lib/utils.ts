/**
 * General utility functions
 * Common helper functions used throughout the application
 * Includes type guards and data transformers
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
