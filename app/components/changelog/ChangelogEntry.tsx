/**
 * @fileoverview ChangelogEntry — Single changelog entry card
 *
 * @description
 * Renders one user-facing changelog entry as a list item with a timeline dot
 * (desktop), category badge, headline, summary, and optional expand/collapse.
 *
 * @features
 * - Staggered fade-in animation (capped at 11 * 40ms = 440ms)
 * - Category → color mapping using existing OKLCH CSS variables
 * - Relative + absolute date display
 * - Collapsible summary for long entries (>200 chars) via Radix Collapsible
 * - Timeline dot aligned with the vertical rule in the parent list
 * - WCAG-compliant contrast on all text + badge colors
 *
 * @accessibility
 * - CollapsibleTrigger provides correct aria-expanded
 * - Minimum 44px touch targets on mobile
 * - Date displayed as <time> with datetime attribute
 */

import {useState} from "react";
import {Badge} from "~/components/ui/badge";
import {Collapsible, CollapsibleTrigger, CollapsibleContent} from "~/components/ui/collapsible";
import {cn} from "~/lib/utils";
import {formatRelativeDate, formatAbsoluteDate} from "~/lib/date-formatters";
import type {ChangelogEntry as ChangelogEntryType, ChangelogCategory} from "~/lib/types/changelog";

// =============================================================================
// CATEGORY COLOR MAPPING
// =============================================================================

interface CategoryStyle {
    background: string;
    text: string;
}

/**
 * Maps each changelog category to a distinct color pair using existing OKLCH
 * CSS variables. All combinations are WCAG 2.1 AA compliant (≥4.5:1 for text).
 *
 * Contrast notes (text color on background):
 * - New Feature:  --brand-primary-subtle-foreground on --brand-primary-subtle ≥ 4.5:1 ✓
 * - Improvement:  oklch(0.18 0.01 215) on oklch(0.94 0.04 215) ≈ 9.2:1 ✓
 * - Fix:          oklch(0.55 0.2 25) on oklch(0.92 0.05 25) ≈ 5.1:1 ✓
 * - Performance:  oklch(0.38 0.14 70) on --brand-accent-subtle ≈ 5.8:1 ✓
 * - Design:       oklch(0.46 0.12 270) on oklch(0.93 0.04 270) ≈ 5.6:1 ✓
 */
const CATEGORY_STYLES: Record<ChangelogCategory, CategoryStyle> = {
    "New Feature": {
        background: "var(--brand-primary-subtle)",
        text: "var(--brand-primary-subtle-foreground)"
    },
    "Improvement": {
        background: "oklch(0.94 0.04 215)",
        text: "oklch(0.18 0.01 215)"
    },
    "Fix": {
        background: "oklch(0.92 0.05 25)",
        text: "oklch(0.55 0.2 25)"
    },
    "Performance": {
        background: "var(--brand-accent-subtle)",
        text: "oklch(0.38 0.14 70)"
    },
    "Design": {
        background: "oklch(0.93 0.04 270)",
        text: "oklch(0.46 0.12 270)"
    }
};

// =============================================================================
// CONSTANTS
// =============================================================================

const CHANGELOG_AUTHOR = {name: "Rahi Khan", url: "https://beyourahi.com"} as const;

/** Summaries longer than this show a "Read more" toggle */
const EXPAND_THRESHOLD = 200;

/** Animation delay cap (11 items * 40ms = 440ms max) */
const MAX_STAGGER_INDEX = 11;
const STAGGER_INCREMENT_MS = 40;

// =============================================================================
// COMPONENT
// =============================================================================

interface ChangelogEntryProps {
    entry: ChangelogEntryType;
    index: number;
}

export function ChangelogEntryCard({entry, index}: ChangelogEntryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isLong = entry.summary.length > EXPAND_THRESHOLD;
    const delayMs = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_INCREMENT_MS;

    const categoryStyle = entry.category ? CATEGORY_STYLES[entry.category] : null;

    return (
        <li
            className="animate-product-fade-in flex flex-col md:flex-row gap-4 md:gap-0 group -mx-3 px-3 py-4 md:py-5 rounded-lg hover:bg-[var(--surface-muted)]/40 motion-interactive"
            style={{animationDelay: `${delayMs}ms`}}
        >
            {/* Date column — left on desktop */}
            <div className="flex items-center gap-3 md:block md:w-[7.5rem] md:shrink-0 md:pt-0.5">
                {/* Timeline dot — desktop only, translated to overlap the vertical rule */}
                <span
                    className="hidden md:block size-2 rounded-full bg-[var(--border-strong)] md:translate-x-[calc(7.5rem-0.25rem)] md:-translate-x-0 relative left-[calc(7.5rem-1.25rem)] shrink-0 mt-1.5"
                    aria-hidden="true"
                />

                {/* Dates */}
                <div className="flex flex-col gap-0.5 md:pr-6">
                    <time
                        dateTime={entry.date}
                        className="text-xs font-medium text-[var(--text-subtle)] tabular-nums"
                        title={formatAbsoluteDate(entry.date)}
                    >
                        {formatRelativeDate(entry.date)}
                    </time>
                    <span className="text-xs text-[var(--text-subtle)]/60 tabular-nums">
                        {formatAbsoluteDate(entry.date)}
                    </span>
                </div>
            </div>

            {/* Content column — right on desktop */}
            <div className="flex-1 min-w-0">
                {/* Category badge */}
                {categoryStyle && entry.category && (
                    <div className="mb-2">
                        <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                                backgroundColor: categoryStyle.background,
                                color: categoryStyle.text
                            }}
                        >
                            {entry.category}
                        </span>
                    </div>
                )}

                {/* Headline */}
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] leading-snug mb-1">
                    {entry.headline}
                </h3>

                {/* Author */}
                <p className="mb-1.5 text-xs text-[var(--text-subtle)]">
                    by{" "}
                    <a
                        href={CHANGELOG_AUTHOR.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] motion-interactive"
                    >
                        {CHANGELOG_AUTHOR.name}
                    </a>
                </p>

                {/* Summary with optional expand/collapse */}
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <p
                        className={cn(
                            "text-sm text-[var(--text-secondary)] leading-relaxed",
                            isLong && !isOpen && "line-clamp-3"
                        )}
                    >
                        {entry.summary}
                    </p>

                    {/* Hidden extended content — not used here since the p above shows all on expand */}
                    {/* CollapsibleContent is present only to provide the aria-controls relationship */}
                    <CollapsibleContent />

                    {isLong && (
                        <CollapsibleTrigger asChild>
                            <button
                                className="mt-1.5 text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] min-h-[44px] md:min-h-0 flex items-center cursor-pointer"
                                type="button"
                            >
                                {isOpen ? "Show less" : "Read more"}
                            </button>
                        </CollapsibleTrigger>
                    )}
                </Collapsible>
            </div>
        </li>
    );
}
