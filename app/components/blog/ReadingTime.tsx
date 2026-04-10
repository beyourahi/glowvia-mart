/**
 * @fileoverview Reading Time Display Component
 *
 * @description
 * Simple component for displaying estimated reading time for article content.
 * Calculates reading time using word count and configurable words-per-minute rate.
 * Optionally displays a clock icon for visual indication.
 *
 * @features
 * - Reading time calculation from HTML or plain text content
 * - Configurable words-per-minute rate (default: 200 WPM)
 * - Optional clock icon display
 * - Responsive typography (xs to sm)
 * - Muted text color for secondary emphasis
 * - Whitespace-nowrap to prevent awkward line breaks
 *
 * @props
 * - content: string - Article content (HTML or plain text) for calculation
 * - wordsPerMinute: number - Reading speed assumption (default: 200)
 * - showIcon: boolean - Toggle clock icon display (default: false)
 * - className: string - Additional Tailwind classes
 *
 * @calculation
 * Reading time is calculated by:
 * 1. Stripping HTML tags from content
 * 2. Counting words (whitespace-separated tokens)
 * 3. Dividing by words-per-minute rate
 * 4. Rounding up to nearest minute
 *
 * Industry standard: 200-250 WPM for technical content, 250-300 WPM for casual reading
 *
 * @related
 * - ~/lib/blog-utils - calculateReadingTime utility function
 * - ~/components/blog/ArticleCard - Uses reading time in metadata
 * - ~/components/blog/ArticleHero - Displays reading time in hero
 */

import {Clock} from "lucide-react";
import {calculateReadingTime} from "~/lib/blog-utils";
import {cn} from "~/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the ReadingTime component.
 */
interface ReadingTimeProps {
    /** HTML or plain text content to calculate reading time from */
    content: string;
    /** Average words per minute (default: 200) */
    wordsPerMinute?: number;
    /** Show clock icon */
    showIcon?: boolean;
    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ReadingTime component for displaying estimated article reading duration.
 *
 * @description
 * Calculates and displays reading time based on content word count and
 * configurable reading speed. Uses industry-standard 200 WPM as default
 * (appropriate for technical blog content).
 *
 * The component:
 * - Strips HTML tags before counting words
 * - Rounds up to nearest minute (minimum 1 minute)
 * - Displays result in "X min read" format
 * - Optionally shows a clock icon for visual indication
 *
 * Reading speed considerations:
 * - 200 WPM: Technical/complex content (default)
 * - 250 WPM: General blog posts
 * - 300 WPM: Casual/entertainment content
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ReadingTime content={article.contentHtml} />
 *
 * // With icon
 * <ReadingTime content={article.contentHtml} showIcon />
 *
 * // Custom reading speed for casual content
 * <ReadingTime content={article.contentHtml} wordsPerMinute={250} />
 * ```
 */
export function ReadingTime({content, wordsPerMinute = 200, showIcon = false, className}: ReadingTimeProps) {
    // Calculate reading time using utility function
    const minutes = calculateReadingTime(content, wordsPerMinute);

    return (
        <span className={cn("text-sm sm:text-sm text-muted-foreground whitespace-nowrap", className)}>
            {showIcon && <Clock className="inline-block size-3 sm:size-3.5 mr-0.5 sm:mr-1 -mt-0.5" />}
            {minutes} min read
        </span>
    );
}
