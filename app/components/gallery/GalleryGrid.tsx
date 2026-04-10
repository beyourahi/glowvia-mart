/**
 * @fileoverview Gallery Grid Component
 *
 * @description
 * Responsive image gallery grid with infinite scroll functionality for displaying product
 * images from Shopify metaobjects. Uses IntersectionObserver for efficient scroll detection
 * and React Router's useFetcher for progressive enhancement and seamless pagination.
 *
 * @related
 * - ~/components/gallery/GalleryImageCard - Individual image card rendering
 * - ~/routes/gallery - Gallery route providing initial images
 * - ~/lib/gallery - Gallery data types and utilities
 */

import * as React from "react";
import {useFetcher, useSearchParams} from "react-router";
import {Spinner} from "~/components/ui/spinner";
import type {GalleryImageData, GalleryPageInfo} from "~/lib/gallery";
import {GalleryImageCard} from "./GalleryImageCard";

// =============================================================================
// TYPES
// =============================================================================

interface GalleryGridProps {
    initialImages: GalleryImageData[];
    pageInfo: GalleryPageInfo;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * GalleryGrid - Displays gallery images with automatic infinite scroll loading.
 *
 * @param initialImages - Initial page of images from server loader
 * @param pageInfo - Pagination metadata (endCursor, hasNextPage)
 *
 * @example
 * ```tsx
 * <GalleryGrid
 *   initialImages={loaderData.images}
 *   pageInfo={loaderData.pageInfo}
 * />
 * ```
 */
export function GalleryGrid({initialImages, pageInfo}: GalleryGridProps) {
    const fetcher = useFetcher<{images: GalleryImageData[]; pageInfo: GalleryPageInfo}>({
        key: "gallery-infinite-scroll"
    });
    const [images, setImages] = React.useState<GalleryImageData[]>(initialImages);
    const [cursor, setCursor] = React.useState<string | null>(pageInfo.endCursor);
    const [hasMore, setHasMore] = React.useState(pageInfo.hasNextPage);
    const [error, setError] = React.useState<string | null>(null);
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const [searchParams] = useSearchParams();

    // =============================================================================
    // EFFECTS
    // =============================================================================

    // Reset when initial images change (e.g., new page load)
    React.useEffect(() => {
        setImages(initialImages);
        setCursor(pageInfo.endCursor);
        setHasMore(pageInfo.hasNextPage);
        setError(null);
    }, [initialImages, pageInfo.endCursor, pageInfo.hasNextPage]);

    /**
     * Append fetched images when fetcher completes.
     * Deduplicates images using Set-based ID tracking to prevent edge case duplicates.
     */
    React.useEffect(() => {
        if (fetcher.data?.images && fetcher.data.images.length > 0) {
            // Deduplicate images to prevent edge case duplicates
            setImages(prev => {
                const existingIds = new Set(prev.map(img => img.id));
                const newImages = fetcher.data!.images.filter(img => !existingIds.has(img.id));
                return [...prev, ...newImages];
            });
            setCursor(fetcher.data.pageInfo.endCursor);
            setHasMore(fetcher.data.pageInfo.hasNextPage);
            setError(null);
        }
    }, [fetcher.data]);

    /**
     * IntersectionObserver for infinite scroll.
     * Triggers fetch 200px before user reaches sentinel element.
     * Only fetches when idle and more pages available.
     */
    React.useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            entries => {
                const [entry] = entries;
                if (entry.isIntersecting && fetcher.state === "idle" && hasMore && cursor) {
                    // Build URL with current params + cursor for fetcher
                    const params = new URLSearchParams(searchParams);
                    params.set("cursor", cursor);
                    params.set("index", ""); // Mark as fetcher request
                    void fetcher.load(`?${params.toString()}`);
                }
            },
            {rootMargin: "200px"} // Trigger 200px before reaching bottom
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher.state and fetcher.load are stable refs
    }, [cursor, hasMore, fetcher.state, searchParams, fetcher.load]);

    // =============================================================================
    // HANDLERS
    // =============================================================================

    /**
     * Retry function for manual reload after fetch error.
     * Rebuilds URL with current search params and cursor.
     */
    const retry = () => {
        if (cursor) {
            setError(null);
            const params = new URLSearchParams(searchParams);
            params.set("cursor", cursor);
            params.set("index", "");
            void fetcher.load(`?${params.toString()}`);
        }
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    const isLoading = fetcher.state === "loading";

    return (
        <div className="flex flex-col gap-4">
            {/* Gallery Grid - compact gaps, 5 columns on ultrawide (1921px+) */}
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5">
                {images.map((image, index) => (
                    <GalleryImageCard key={image.id} image={image} priority={index < 8} index={index} />
                ))}
            </div>

            {/* Sentinel element for intersection observer + Loading indicator */}
            <div ref={sentinelRef} className="flex justify-center py-4 min-h-[60px]">
                {isLoading && <Spinner className="size-6" />}
                {error && (
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-destructive">{error}</span>
                        <button
                            type="button"
                            onClick={retry}
                            className="select-none text-sm text-primary underline hover:no-underline"
                        >
                            Try again
                        </button>
                    </div>
                )}
                {!hasMore && !error && images.length > 0 && (
                    <span className="text-sm text-muted-foreground">You&apos;ve seen it all</span>
                )}
            </div>
        </div>
    );
}
