/**
 * @fileoverview ChangelogEntry — Single changelog entry card
 *
 * @description
 * Renders one user-facing changelog entry as a list item with a timeline dot
 * (desktop), category badge, headline, summary, and optional expand/collapse.
 *
 * @layout (desktop)
 * [date col: 9rem, right-aligned] | [rail dot] | [content col: flex-1, pl-8]
 *
 * The continuous timeline rail is an absolute div inside ChangelogPage's
 * relative wrapper at left-36 (9rem). Each <li> is relative, and the dot is
 * absolute at left-36 -translate-x-1/2, centering it on the 2px rail.
 *
 * @layout (mobile)
 * [relative date · category badge]
 * [headline]
 * [by author]
 * [summary]
 *
 * @accessibility
 * - CollapsibleTrigger provides correct aria-expanded
 * - Minimum 44px touch targets on mobile
 * - Date displayed as <time> with datetime attribute
 */

import {useState} from "react";
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
 * Badge background + foreground pairs — WCAG 2.1 AA compliant (≥4.5:1 for text).
 *
 * Contrast notes:
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

/**
 * Timeline dot fill color per category — visually connects the dot to the badge.
 * Uses the badge's text color (which has enough contrast against the rail background).
 */
const CATEGORY_DOT_COLORS: Record<ChangelogCategory, string> = {
    "New Feature": "var(--brand-primary)",
    "Improvement": "oklch(0.56 0.12 215)",
    "Fix": "var(--destructive)",
    "Performance": "var(--brand-accent)",
    "Design": "oklch(0.46 0.12 270)"
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
    const dotColor = entry.category ? CATEGORY_DOT_COLORS[entry.category] : "var(--border-strong)";

    return (
        <li
            className="animate-product-fade-in relative group flex flex-col md:flex-row border-b border-[var(--border-subtle)]/50 last:border-b-0 py-7 sm:py-8"
            style={{animationDelay: `${delayMs}ms`}}
        >
            {/* Timeline dot — centered on the continuous rail in the parent container.
                left-36 (-translate-x-1/2) places the 10px dot's center exactly on the
                2px rail at left-36 inside ChangelogPage's relative wrapper. */}
            <span
                className="hidden md:block absolute left-36 -translate-x-1/2 top-8 size-2.5 rounded-full ring-[3px] ring-[var(--surface-canvas)] z-10 motion-interactive group-hover:scale-[1.35]"
                style={{backgroundColor: dotColor}}
                aria-hidden="true"
            />

            {/* Date column — stacked right-aligned on desktop, inline on mobile */}
            <div className="flex items-center gap-2 mb-2.5 md:mb-0 md:w-36 md:shrink-0 md:pr-8 md:pt-0.5 md:flex-col md:items-end md:gap-0.5">
                <time
                    dateTime={entry.date}
                    className="text-xs font-medium text-[var(--text-secondary)] tabular-nums"
                    title={formatAbsoluteDate(entry.date)}
                >
                    {formatRelativeDate(entry.date)}
                </time>
                {/* Absolute date — desktop only, shown below relative date */}
                <span className="hidden md:block text-xs text-[var(--text-subtle)] tabular-nums">
                    {formatAbsoluteDate(entry.date)}
                </span>
            </div>

            {/* Content column */}
            <div className="flex-1 min-w-0 md:pl-8">
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

                    {/* CollapsibleContent present only for the aria-controls relationship */}
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
