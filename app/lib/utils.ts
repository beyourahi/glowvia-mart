/** @fileoverview General utility functions — class merging and text truncation. */

import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

/**
 * Merges Tailwind class names with conflict resolution.
 * @example cn("px-2", isActive && "bg-primary", props.className)
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
    if (!text) return "";

    const {suffix = "...", stripHtml = true, breakOnWord = true} = options || {};

    let cleanText = text;
    if (stripHtml) {
        cleanText = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    }

    if (cleanText.length <= maxLength) {
        return cleanText;
    }

    let truncated = cleanText.substring(0, maxLength);

    if (breakOnWord) {
        const lastSpaceIndex = truncated.lastIndexOf(" ");
        if (lastSpaceIndex > 0) {
            truncated = truncated.substring(0, lastSpaceIndex);
        }
    }

    return truncated + suffix;
}
