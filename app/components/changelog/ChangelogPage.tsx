/**
 * @fileoverview ChangelogPage — Full changelog page layout
 *
 * @description
 * Renders the /changelog page with a hero search, category filter chips,
 * a vertical timeline list of entries, and a "Load more" button for pagination.
 *
 * @features
 * - Hero with h1 + subtitle + centered search input
 * - Category filter chips (All, New Feature, Improvement, Fix, Performance, Design)
 * - Vertical timeline with left rule on md+ viewports
 * - Staggered entry animations via ChangelogEntryCard
 * - Client-side "Load more" pagination (10 entries at a time, no URL changes)
 * - Empty state when search/filter returns no results
 * - Skeleton loading state (ChangelogPageSkeleton)
 *
 * @layout
 * max-w-3xl mx-auto:
 *   1. Hero (center-aligned, pt-page-breathing-room)
 *   2. Filter chips row
 *   3. Timeline container (relative, with absolute vertical rule on md+)
 *      └── <ol> of ChangelogEntryCard
 *   4. Load-more button
 *
 * @accessibility
 * - Search: role="search" landmark
 * - Filter chips: role="radiogroup" with aria-pressed per chip
 * - Entry list: <ol> with ordered list semantics
 * - Load-more: <button> with descriptive label
 */

import {useState, useEffect} from "react";
import {Search} from "lucide-react";
import {Input} from "~/components/ui/input";
import {Button} from "~/components/ui/button";
import {Skeleton} from "~/components/ui/skeleton";
import {Empty, EmptyHeader, EmptyTitle, EmptyDescription} from "~/components/ui/empty";
import {ChangelogEntryCard} from "~/components/changelog/ChangelogEntry";
import {useChangelogFilter} from "~/hooks/useChangelogFilter";
import type {ChangelogCategory, ChangelogLoaderData} from "~/lib/types/changelog";

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

const INITIAL_VISIBLE = 10;
const LOAD_MORE_INCREMENT = 10;

// =============================================================================
// CHANGELOG PAGE
// =============================================================================

export function ChangelogPage({entries}: ChangelogLoaderData) {
    const {filteredEntries, setSearch, setCategory, activeCategory, searchQuery, isEmpty} =
        useChangelogFilter(entries);

    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

    // Reset visible count whenever the user changes the search or category filter
    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE);
    }, [activeCategory, searchQuery]);

    const visibleEntries = filteredEntries.slice(0, visibleCount);
    const hasMore = visibleCount < filteredEntries.length;

    return (
        <div className="min-h-dvh bg-[var(--surface-canvas)] pt-[var(--total-header-height)]">
            {/* ───── Hero ───── */}
            <section className="pt-(--page-breathing-room) pb-8 sm:pb-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-primary)] mb-3">
                        Product Updates
                    </p>
                    <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[var(--text-primary)] mb-4">
                        What&apos;s New
                    </h1>
                    <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-md mx-auto mb-8">
                        A running record of everything we&apos;ve shipped — features, fixes, and improvements.
                    </p>

                    {/* Search */}
                    <div className="relative max-w-sm mx-auto" role="search">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-subtle)] pointer-events-none"
                            aria-hidden="true"
                        />
                        <Input
                            type="search"
                            placeholder="Search updates…"
                            value={searchQuery}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                            aria-label="Search changelog entries"
                        />
                    </div>
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

            {/* ───── Timeline ───── */}
            <section className="pb-16 sm:pb-20 md:pb-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 relative">
                    {/* Vertical timeline rule — desktop only */}
                    <div
                        className="hidden md:block absolute left-[calc(1.5rem+7.5rem)] top-0 bottom-0 w-px bg-[var(--border-subtle)]"
                        aria-hidden="true"
                    />

                    {isEmpty ? (
                        <Empty className="border-[var(--border-subtle)] mt-4">
                            <EmptyHeader>
                                <EmptyTitle>No updates found</EmptyTitle>
                                <EmptyDescription>
                                    Try adjusting your search or clearing the category filter.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <ol className="divide-y divide-[var(--border-subtle)]/50">
                            {visibleEntries.map((entry, index) => (
                                <ChangelogEntryCard
                                    key={`${entry.date}-${entry.headline}`}
                                    entry={entry}
                                    index={index}
                                />
                            ))}
                        </ol>
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

function ChangelogEntrySkeleton({index}: {index: number}) {
    return (
        <li
            className="flex flex-col md:flex-row gap-4 md:gap-0 py-4 md:py-5 animate-pulse"
            style={{animationDelay: `${index * 80}ms`}}
        >
            {/* Date column */}
            <div className="md:w-[7.5rem] md:shrink-0 md:pr-6 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
            </div>
            {/* Content */}
            <div className="flex-1 space-y-2.5">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-3/4 rounded" />
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-4 w-2/3 rounded" />
                </div>
            </div>
        </li>
    );
}

export function ChangelogPageSkeleton() {
    return (
        <div className="min-h-dvh bg-[var(--surface-canvas)] pt-[var(--total-header-height)]">
            {/* Hero skeleton */}
            <section className="pt-(--page-breathing-room) pb-8 sm:pb-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-4">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-10 w-48 rounded" />
                    <Skeleton className="h-5 w-72 rounded" />
                    <Skeleton className="h-10 w-64 rounded-xl mt-2" />
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

            {/* Entry skeletons */}
            <section className="pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <ol className="divide-y divide-[var(--border-subtle)]/50">
                        {Array.from({length: 5}).map((_, i) => (
                            // eslint-disable-next-line react/no-array-index-key -- static skeleton
                            <ChangelogEntrySkeleton key={i} index={i} />
                        ))}
                    </ol>
                </div>
            </section>
        </div>
    );
}
