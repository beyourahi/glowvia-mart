/**
 * @fileoverview ChangelogEntry — Single changelog entry card
 *
 * @description
 * Renders one user-facing changelog entry as a card with category badge,
 * headline, and full summary text. Dates are grouped at the
 * section level (ChangelogPage) rather than per-entry.
 *
 * @accessibility
 * - article element provides semantic sectioning
 * - Minimum 44px touch targets on mobile
 */

import {cn} from "~/lib/utils";
import type {ChangelogEntry as ChangelogEntryType, ChangelogCategory} from "~/lib/types/changelog";

// =============================================================================
// AUTHOR
// =============================================================================

const CHANGELOG_AUTHOR = {name: "Rahi Khan", url: "https://beyourahi.com"} as const;

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
 * - Fix:          oklch(0.35 0.10 185) on oklch(0.93 0.04 185) ≈ 6.2:1 ✓  [teal — no red/destructive signal]
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
        background: "oklch(0.93 0.04 185)",
        text: "oklch(0.35 0.10 185)"
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
 * Timeline dot fill color per category — preserved for potential future use.
 */
const CATEGORY_DOT_COLORS: Record<ChangelogCategory, string> = {
    "New Feature": "var(--brand-primary)",
    "Improvement": "oklch(0.56 0.12 215)",
    "Fix": "oklch(0.55 0.12 185)",
    "Performance": "var(--brand-accent)",
    "Design": "oklch(0.46 0.12 270)"
};

// =============================================================================
// CONSTANTS
// =============================================================================

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
    const delayMs = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_INCREMENT_MS;
    const categoryStyle = entry.category ? CATEGORY_STYLES[entry.category] : null;

    return (
        <article
            className={cn(
                "animate-product-fade-in bg-[var(--surface-raised)] rounded-xl border border-[var(--border-subtle)]",
                "border-l-4 overflow-hidden shadow-[var(--shadow-xs)] p-4 sm:p-5 motion-interactive hover:shadow-[var(--shadow-sm)] hover:-translate-y-px"
            )}
            style={{
                animationDelay: `${delayMs}ms`,
                borderLeftColor: entry.category ? CATEGORY_DOT_COLORS[entry.category] : "var(--border-subtle)"
            }}
        >
            {categoryStyle && entry.category && (
                <div className="mb-2">
                    <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{backgroundColor: categoryStyle.background, color: categoryStyle.text}}
                    >
                        {entry.category}
                    </span>
                </div>
            )}
            <h3 className="font-serif text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-snug mt-2 mb-1.5">
                {entry.headline}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{entry.summary}</p>
            <p className="mt-3 text-xs text-[var(--text-subtle)]">
                by{" "}
                <a
                    href={CHANGELOG_AUTHOR.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--text-secondary)] underline underline-offset-2 decoration-[var(--border-subtle)] hover:text-[var(--brand-primary)] motion-link"
                >
                    {CHANGELOG_AUTHOR.name}
                </a>
            </p>
        </article>
    );
}

// Re-export dot colors for potential external use (e.g. legend components)
export {CATEGORY_DOT_COLORS};
