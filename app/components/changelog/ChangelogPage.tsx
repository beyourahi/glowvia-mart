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
 * px-4 sm:px-6 lg:px-8 outer wrapper (no pt — PageLayout main already clears the header):
 *   1. Hero (center-aligned, pt-(--page-breathing-room) — standard breathing room)
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
import {PageHeading} from "~/components/PageHeading";

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

export function ChangelogPage({entries, totalCommits}: ChangelogLoaderData) {
    const {filteredEntries, setCategory, activeCategory, isEmpty} = useChangelogFilter(entries);

    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

    // Reset visible count whenever the user changes the category filter
    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE);
    }, [activeCategory]);

    const visibleEntries = filteredEntries.slice(0, visibleCount);
    const hasMore = visibleCount < filteredEntries.length;

    return (
        <div className="bg-[var(--surface-canvas)] px-4 sm:px-6 lg:px-8">
            {/* ───── Hero ───── */}
            <section className="pt-(--page-breathing-room) pb-5 sm:pb-6">
                <div className="text-center">
                    <PageHeading
                        title="Changelog"
                        description="A running record of everything we've shipped — features, fixes, and improvements."
                    />
                    {totalCommits != null && (
                        <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2">
                            {/* Ruled line with dot — mirrors timeline group dot motif */}
                            <div className="flex w-full max-w-xs items-center gap-3" aria-hidden="true">
                                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                                <div className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                            </div>

                            <div className="py-1 text-center">
                                <p className="font-serif text-fluid-h2 font-bold tabular-nums leading-none text-[var(--brand-primary)]">
                                    {totalCommits.toLocaleString("en-US")}
                                </p>
                                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-subtle)]">
                                    updates shipped
                                </p>
                            </div>

                            {/* Mirrored bottom rule */}
                            <div className="flex w-full max-w-xs items-center gap-3" aria-hidden="true">
                                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                                <div className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ───── Filter chips ───── */}
            <section className="pb-8 sm:pb-10">
                <div
                    className="flex flex-wrap justify-center gap-2"
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
                <div className="max-w-5xl mx-auto">
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
                                        <div key={group.date} className="mb-10 sm:mb-12 lg:flex">
                                            {/* Mobile sticky date header — full-bleed, hidden on desktop */}
                                            <div className="sticky top-[var(--total-header-height)] z-20 -mx-4 sm:-mx-6 bg-[var(--surface-canvas)] px-4 sm:px-6 py-2 lg:hidden">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        <time dateTime={group.date}>{formatAbsoluteDate(group.date)}</time>
                                                        {" · "}
                                                        {formatRelativeDayLabel(group.date)}
                                                    </span>
                                                    <span className="shrink-0 inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-subtle)] tabular-nums">
                                                        {group.entries.length} {group.entries.length === 1 ? "update" : "updates"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Desktop date column — sticky, right-aligned, hidden on mobile */}
                                            <div className="hidden lg:flex lg:w-44 lg:shrink-0 lg:flex-col lg:items-end lg:pr-8 lg:pt-1.5 lg:sticky lg:top-[var(--total-header-height)] lg:self-start lg:z-20">
                                                <time dateTime={group.date} className="text-right text-xs font-mono font-medium leading-tight text-[var(--text-primary)]">
                                                    {formatAbsoluteDate(group.date)}
                                                </time>
                                                <span className="mt-0.5 text-right text-xs text-[var(--text-subtle)]">
                                                    {formatRelativeDayLabel(group.date)}
                                                </span>
                                                <span className="mt-2 inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-subtle)] tabular-nums">
                                                    {group.entries.length} {group.entries.length === 1 ? "update" : "updates"}
                                                </span>
                                            </div>

                                            {/* Vertical rail + dot + entries */}
                                            <div className="relative flex-1 lg:border-l-2 lg:border-[var(--border-subtle)] lg:pl-8">
                                                {/* Timeline dot — one per group, only on desktop */}
                                                <div
                                                    className="hidden lg:block absolute -left-[7px] top-4 h-3 w-3 rounded-full bg-[var(--brand-primary)] ring-4 ring-[var(--surface-canvas)]"
                                                    aria-hidden="true"
                                                />
                                                <div className="space-y-5 lg:space-y-6">
                                                    {group.entries.map(entry => (
                                                        <ChangelogEntryCard
                                                            key={`${entry.date}-${entry.headline}`}
                                                            entry={entry}
                                                            index={globalStaggerIndex++}
                                                        />
                                                    ))}
                                                </div>
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
        <div className="mb-10 sm:mb-12 lg:flex">
            {/* Mobile date header skeleton */}
            <div className="lg:hidden py-2 mb-4">
                <Skeleton className="h-4 w-44 rounded" />
            </div>
            {/* Desktop date column skeleton */}
            <div className="hidden lg:flex lg:w-44 lg:shrink-0 lg:flex-col lg:items-end lg:pr-8 lg:pt-1.5">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3 w-12 rounded mt-1" />
                <Skeleton className="h-5 w-16 rounded-full mt-2" />
            </div>
            {/* Rail + entries skeleton */}
            <div className="relative flex-1 lg:border-l-2 lg:border-[var(--border-subtle)] lg:pl-8">
                <div className="space-y-5 lg:space-y-6">
                    {Array.from({length: 3}).map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key -- static skeleton
                        <ChangelogCardSkeleton key={i} index={startIndex + i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ChangelogPageSkeleton() {
    return (
        <div className="bg-[var(--surface-canvas)] px-4 sm:px-6 lg:px-8">
            {/* Hero skeleton */}
            <section className="pt-(--page-breathing-room) pb-5 sm:pb-6">
                <div className="flex flex-col items-center gap-3">
                    <Skeleton className="h-8 w-36 rounded" />
                    <Skeleton className="h-4 w-72 rounded" />
                    <Skeleton className="h-3 w-20 rounded mt-2" />
                </div>
            </section>

            {/* Filter chips skeleton */}
            <section className="pb-8 sm:pb-10">
                <div className="flex flex-wrap justify-center gap-2">
                    {Array.from({length: 6}).map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key -- static skeleton
                        <Skeleton key={i} className="h-8 w-24 rounded-full" />
                    ))}
                </div>
            </section>

            {/* Entry group skeletons */}
            <section className="pb-16 sm:pb-20 md:pb-24">
                <div>
                    <ChangelogGroupSkeleton startIndex={0} />
                    <ChangelogGroupSkeleton startIndex={3} />
                </div>
            </section>
        </div>
    );
}
