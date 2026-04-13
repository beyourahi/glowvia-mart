/**
 * @fileoverview ChangelogPage — Full changelog page layout
 *
 * @description
 * Renders the /changelog page with a compact hero, category filter chips,
 * date-grouped entry cards, and a "Load more" button for pagination.
 *
 * @features
 * - Compact hero with h1 + subtitle (no forced min-height)
 * - Category filter chips (All, New Feature, Improvement, Fix, Performance, Design)
 * - Entries grouped by date with serif section headers + horizontal rule
 * - Staggered entry card animations via ChangelogEntryCard (global stagger index)
 * - Client-side "Load more" pagination (50 entries at a time, no URL changes)
 * - Empty state when filter returns no results
 * - Skeleton loading state (ChangelogPageSkeleton)
 *
 * @layout
 * max-w-3xl mx-auto:
 *   1. Hero (center-aligned, pt-6 sm:pt-8 — compact, no forced viewport height)
 *   2. Filter chips row
 *   3. Date-grouped cards (IIFE scopes globalStaggerIndex across groups)
 *   4. Load-more button
 *
 * @accessibility
 * - Filter chips: role="radiogroup" with aria-checked per chip
 * - Date group headers: <h2> for correct heading hierarchy
 */

import {useState, useEffect} from "react";
import {Button} from "~/components/ui/button";
import {Skeleton} from "~/components/ui/skeleton";
import {Empty, EmptyHeader, EmptyTitle, EmptyDescription} from "~/components/ui/empty";
import {ChangelogEntryCard} from "~/components/changelog/ChangelogEntry";
import {useChangelogFilter} from "~/hooks/useChangelogFilter";
import {formatAbsoluteDate, formatRelativeDayLabel} from "~/lib/date-formatters";
import type {ChangelogCategory, ChangelogEntry as ChangelogEntryType, ChangelogLoaderData} from "~/lib/types/changelog";

// =============================================================================
// CONSTANTS
// =============================================================================

const ALL_CATEGORIES: ChangelogCategory[] = [
    "New Feature",
    "Improvement",
    "Fix",
    "Performance",
    "Design"
];

const INITIAL_VISIBLE = 100;
const LOAD_MORE_INCREMENT = 50;

// =============================================================================
// HELPERS
// =============================================================================

interface DateGroup {
    date: string;
    entries: ChangelogEntryType[];
}

/**
 * Groups an ordered array of entries by their `date` field, preserving
 * insertion order (newest-first, as CHANGELOG_ENTRIES is authored).
 */
function groupEntriesByDate(entries: ChangelogEntryType[]): DateGroup[] {
    const map = new Map<string, ChangelogEntryType[]>();
    for (const entry of entries) {
        const existing = map.get(entry.date);
        if (existing) existing.push(entry);
        else map.set(entry.date, [entry]);
    }
    return Array.from(map.entries()).map(([date, entries]) => ({date, entries}));
}

// =============================================================================
// CHANGELOG PAGE
// =============================================================================

export function ChangelogPage({entries}: ChangelogLoaderData) {
    const {filteredEntries, setCategory, activeCategory, isEmpty} = useChangelogFilter(entries);

    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

    // Reset visible count whenever the user changes the category filter
    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE);
    }, [activeCategory]);

    const visibleEntries = filteredEntries.slice(0, visibleCount);
    const hasMore = visibleCount < filteredEntries.length;

    return (
        <div className="bg-[var(--surface-canvas)] pt-[var(--total-header-height)]">
            {/* ───── Hero ───── */}
            <section className="pt-6 sm:pt-8 pb-5 sm:pb-6">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-[var(--text-primary)] mb-2">
                        What&apos;s New
                    </h1>
                    <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md mx-auto">
                        A running record of everything we&apos;ve shipped — features, fixes, and improvements.
                    </p>
                </div>
            </section>

            {/* ───── Filter chips ───── */}
            <section className="pb-8 sm:pb-10">
                <div
                    className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-wrap justify-center gap-2"
                    role="radiogroup"
                    aria-label="Filter by category"
                >
                    {/* All chip */}
                    <button
                        type="button"
                        role="radio"
                        aria-checked={activeCategory === null}
                        onClick={() => setCategory(null)}
                        className={
                            activeCategory === null
                                ? "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-[var(--brand-primary)] text-white cursor-pointer motion-interactive"
                                : "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer motion-interactive"
                        }
                    >
                        All
                    </button>

                    {ALL_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            role="radio"
                            aria-checked={activeCategory === cat}
                            onClick={() => setCategory(cat)}
                            className={
                                activeCategory === cat
                                    ? "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-[var(--brand-primary)] text-white cursor-pointer motion-interactive"
                                    : "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer motion-interactive"
                            }
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* ───── Grouped entries ───── */}
            <section className="pb-16 sm:pb-20 md:pb-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    {isEmpty ? (
                        <Empty className="border-[var(--border-subtle)] mt-4">
                            <EmptyHeader>
                                <EmptyTitle>No updates found</EmptyTitle>
                                <EmptyDescription>
                                    Try clearing the category filter.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        /* IIFE scopes globalStaggerIndex so animation delays are continuous
                           across all date groups rather than resetting per group. */
                        (() => {
                            let globalStaggerIndex = 0;
                            return (
                                <div>
                                    {groupEntriesByDate(visibleEntries).map(group => (
                                        <div key={group.date} className="mb-10 sm:mb-12">
                                            {/* Date section header with decorative rule.
                                                sticky + top offset parks it just below the fixed navbar
                                                while its group's entries are in view. bg-[surface-canvas]
                                                prevents entry cards from bleeding through during scroll. */}
                                            <div className="sticky top-[var(--total-header-height)] z-10 bg-[var(--surface-canvas)] flex items-center gap-3 mb-4 sm:mb-5">
                                                <div className="flex items-baseline gap-2 shrink-0">
                                                    <h2 className="font-serif text-base sm:text-lg font-medium text-[var(--text-secondary)]">
                                                        {formatAbsoluteDate(group.date)}
                                                    </h2>
                                                    <span className="text-xs text-[var(--text-subtle)]">
                                                        {formatRelativeDayLabel(group.date)}
                                                    </span>
                                                </div>
                                                <div
                                                    className="flex-1 h-px bg-[var(--border-subtle)]"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                {group.entries.map(entry => (
                                                    <ChangelogEntryCard
                                                        key={`${entry.date}-${entry.headline}`}
                                                        entry={entry}
                                                        index={globalStaggerIndex++}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    )}

                    {/* Load more */}
                    {hasMore && !isEmpty && (
                        <div className="mt-8 flex justify-center">
                            <Button
                                variant="outline"
                                onClick={() => setVisibleCount(c => c + LOAD_MORE_INCREMENT)}
                            >
                                Load more updates
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

// =============================================================================
// SKELETON
// =============================================================================

function ChangelogCardSkeleton({index}: {index: number}) {
    return (
        <div
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 sm:p-5 animate-pulse"
            style={{animationDelay: `${index * 80}ms`}}
        >
            <Skeleton className="h-5 w-24 rounded-full mb-2" />
            <Skeleton className="h-5 w-3/4 rounded mt-2 mb-1.5" />
            <div className="space-y-1.5">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
            </div>
        </div>
    );
}

function ChangelogGroupSkeleton({startIndex}: {startIndex: number}) {
    return (
        <div className="mb-10 sm:mb-12">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <Skeleton className="h-5 w-28 rounded shrink-0" />
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>
            <div className="space-y-3">
                {Array.from({length: 3}).map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key -- static skeleton
                    <ChangelogCardSkeleton key={i} index={startIndex + i} />
                ))}
            </div>
        </div>
    );
}

export function ChangelogPageSkeleton() {
    return (
        <div className="bg-[var(--surface-canvas)] pt-[var(--total-header-height)]">
            {/* Hero skeleton */}
            <section className="pt-6 sm:pt-8 pb-5 sm:pb-6">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-3">
                    <Skeleton className="h-8 w-36 rounded" />
                    <Skeleton className="h-4 w-72 rounded" />
                </div>
            </section>

            {/* Filter chips skeleton */}
            <section className="pb-8 sm:pb-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-wrap justify-center gap-2">
                    {Array.from({length: 6}).map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key -- static skeleton
                        <Skeleton key={i} className="h-8 w-24 rounded-full" />
                    ))}
                </div>
            </section>

            {/* Entry group skeletons */}
            <section className="pb-16 sm:pb-20 md:pb-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <ChangelogGroupSkeleton startIndex={0} />
                    <ChangelogGroupSkeleton startIndex={3} />
                </div>
            </section>
        </div>
    );
}
