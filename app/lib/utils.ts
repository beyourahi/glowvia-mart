/**
 * @fileoverview General Utility Functions
 *
 * @description
 * Common utility functions used throughout the application.
 * Currently provides the `cn` function for merging Tailwind CSS classes.
 *
 * @architecture
 * This is the central utility module. Keep functions here only if they are:
 * - Used across multiple unrelated parts of the codebase
 * - Simple and single-purpose
 * - Not specific to any domain (product, cart, etc.)
 *
 * @dependencies
 * - clsx - Conditional class name construction
 * - tailwind-merge - Intelligent Tailwind class merging
 *
 * @related
 * - All components - Use cn() for className props
 * - shadcn/ui components - Also use this utility
 *
 * @example
 * ```tsx
 * <div className={cn(
 *   "base-class",
 *   isActive && "active-class",
 *   props.className
 * )} />
 * ```
 */

import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

// =============================================================================
// CLASS NAME UTILITIES
// =============================================================================

/**
 * Merges class names with Tailwind-aware conflict resolution.
 *
 * Combines the power of clsx (conditional classes) with tailwind-merge
 * (intelligent Tailwind class merging). This prevents issues like:
 * - "p-2 p-4" → only p-4 is applied
 * - "text-red-500 text-blue-500" → only last one wins
 *
 * @param inputs - Class values (strings, objects, arrays, conditionals)
 *
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn("px-4", "py-2")
 * // → "px-4 py-2"
 *
 * // Conditional classes
 * cn("base", isActive && "active", isFocused && "ring-2")
 * // → "base active" (if isActive is true)
 *
 * // Override pattern (common in component APIs)
 * cn("bg-primary text-white", props.className)
 * // → If className includes "bg-secondary", only bg-secondary is kept
 *
 * // Object syntax
 * cn({ "hidden": !isVisible, "block": isVisible })
 * ```
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

/**
 * Truncates text to a specified length at word boundaries with customizable options.
 *
 * This utility is designed for creating clean, readable text excerpts (e.g., collection
 * descriptions in hero cards). It intelligently handles HTML content, respects word
 * boundaries, and provides consistent ellipsis formatting.
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum character length (default: 200)
 * @param options - Optional configuration
 * @param options.suffix - Text to append when truncated (default: "...")
 * @param options.stripHtml - Remove HTML tags before truncating (default: true)
 * @param options.breakOnWord - Truncate at word boundaries (default: true)
 *
 * @returns Truncated text with suffix if applicable
 *
 * @example
 * ```tsx
 * // Basic usage
 * truncateText("This is a very long description that needs to be shortened", 30)
 * // → "This is a very long..."
 *
 * // With HTML stripping
 * truncateText("<p>This is <strong>HTML</strong> content</p>", 20)
 * // → "This is HTML content"
 *
 * // Custom suffix
 * truncateText("Long text here", 10, { suffix: " [more]" })
 * // → "Long text [more]"
 *
 * // Preserve mid-word cuts
 * truncateText("Supercalifragilistic", 10, { breakOnWord: false })
 * // → "Supercalif..."
 * ```
 */
export function truncateText(
    text: string | null | undefined,
    maxLength: number = 200,
    options?: {
        suffix?: string;
        stripHtml?: boolean;
        breakOnWord?: boolean;
    }
): string {
    // Handle null/undefined/empty
    if (!text) return "";

    const {suffix = "...", stripHtml = true, breakOnWord = true} = options || {};

    // Strip HTML tags if requested (using regex for server-side safety)
    let cleanText = text;
    if (stripHtml) {
        // Remove HTML tags while preserving text content
        cleanText = text.replace(/<[^>]*>/g, "");
        // Clean up multiple spaces and trim
        cleanText = cleanText.replace(/\s+/g, " ").trim();
    }

    // If text is already short enough, return as-is
    if (cleanText.length <= maxLength) {
        return cleanText;
    }

    // Truncate to max length
    let truncated = cleanText.substring(0, maxLength);

    // If breaking on word boundaries, find the last space
    if (breakOnWord) {
        const lastSpaceIndex = truncated.lastIndexOf(" ");
        if (lastSpaceIndex > 0) {
            truncated = truncated.substring(0, lastSpaceIndex);
        }
    }

    // Add suffix
    return truncated + suffix;
}
