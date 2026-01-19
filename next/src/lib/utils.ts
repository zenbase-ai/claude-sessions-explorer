/**
 * Utility functions for the Claude Sessions Explorer web app.
 *
 * This module provides common helper functions used throughout the application
 * for styling, formatting, and text manipulation.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge.
 *
 * This is the standard pattern for conditionally applying Tailwind classes
 * while properly handling conflicts (e.g., "p-2 p-4" becomes "p-4").
 *
 * @param inputs - Any number of class values (strings, objects, arrays)
 * @returns A single merged class string
 *
 * @example
 * cn("p-4", isActive && "bg-blue-500", { "opacity-50": isDisabled })
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

/**
 * Formats an ISO date string into a human-readable format.
 *
 * Output format: "Jan 18, 2026, 6:21 PM"
 *
 * @param dateString - ISO 8601 date string (e.g., "2026-01-18T18:21:00Z")
 * @returns Formatted date string in US English locale
 *
 * @example
 * formatDate("2026-01-18T18:21:00Z") // "Jan 18, 2026, 6:21 PM"
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Truncates a string to a maximum length with ellipsis.
 *
 * Used for displaying preview text (e.g., session first prompts).
 *
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Original string if short enough, or truncated with "..."
 *
 * @example
 * truncate("Hello World", 5) // "Hello..."
 * truncate("Hi", 5) // "Hi"
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "..."
}

/**
 * Extracts the last folder name from a file path.
 *
 * Used to get a simple project name from a full path.
 *
 * @param fullPath - Full file path (e.g., "/Users/amir/workspace/myapp")
 * @returns Last folder name (e.g., "myapp")
 *
 * @example
 * getProjectName("/Users/amir/workspace/myapp") // "myapp"
 * getProjectName("myapp") // "myapp"
 */
export const getProjectName = (fullPath: string): string => {
  // Split path and filter out empty strings (handles leading/trailing slashes)
  const parts = fullPath.split("/").filter(Boolean)
  return parts[parts.length - 1] || fullPath
}
