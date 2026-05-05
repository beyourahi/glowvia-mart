/**
 * @fileoverview Estimated reading time display (e.g. "4 min read").
 * Delegates to `calculateReadingTime` from `~/lib/blog-utils` — 200 WPM default,
 * strips HTML, rounds up to nearest minute.
 */

import {Clock} from "lucide-react";
import {calculateReadingTime} from "~/lib/blog-utils";
import {cn} from "~/lib/utils";

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

export function ReadingTime({content, wordsPerMinute = 200, showIcon = false, className}: ReadingTimeProps) {
    const minutes = calculateReadingTime(content, wordsPerMinute);

    return (
        <span className={cn("text-sm sm:text-sm text-muted-foreground whitespace-nowrap", className)}>
            {showIcon && <Clock className="inline-block size-3 sm:size-3.5 mr-0.5 sm:mr-1 -mt-0.5" />}
            {minutes} min read
        </span>
    );
}
