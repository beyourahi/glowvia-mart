/**
 * @fileoverview Responsive masonry gallery grid with infinite scroll via IntersectionObserver.
 *
 * @related
 * - ~/components/gallery/GalleryImageCard - Individual image card
 * - ~/routes/gallery - Gallery route providing initial images + pagination
 * - ~/lib/gallery - GalleryImageData and GalleryPageInfo types
 */

import * as React from "react";
import {useFetcher, useSearchParams} from "react-router";
import {Spinner} from "~/components/ui/spinner";
import type {GalleryImageData, GalleryPageInfo} from "~/lib/gallery";
import {GalleryImageCard} from "./GalleryImageCard";

interface GalleryGridProps {
    initialImages: GalleryImageData[];
    pageInfo: GalleryPageInfo;
}

/** Masonry gallery grid with IntersectionObserver-driven infinite scroll. */
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

    // Reset when initial images change (e.g., new page load)
    React.useEffect(() => {
        setImages(initialImages);
        setCursor(pageInfo.endCursor);
        setHasMore(pageInfo.hasNextPage);
        setError(null);
    }, [initialImages, pageInfo.endCursor, pageInfo.hasNextPage]);

    // Append fetched images; deduplicate by ID to guard against edge-case repeats.
    React.useEffect(() => {
        if (fetcher.data?.images && fetcher.data.images.length > 0) {
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

    // IntersectionObserver: trigger fetch 200px before the sentinel is reached.
    React.useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            entries => {
                const [entry] = entries;
                if (entry.isIntersecting && fetcher.state === "idle" && hasMore && cursor) {
                    const params = new URLSearchParams(searchParams);
                    params.set("cursor", cursor);
                    params.set("index", ""); // signals a fetcher (not a navigation) request
                    void fetcher.load(`?${params.toString()}`);
                }
            },
            {rootMargin: "200px"}
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher.state and fetcher.load are stable refs
    }, [cursor, hasMore, fetcher.state, searchParams, fetcher.load]);

    const retry = () => {
        if (cursor) {
            setError(null);
            const params = new URLSearchParams(searchParams);
            params.set("cursor", cursor);
            params.set("index", "");
            void fetcher.load(`?${params.toString()}`);
        }
    };

    const isLoading = fetcher.state === "loading";

    return (
        <div className="flex flex-col gap-4">
            {/* CSS columns for masonry layout — 5 columns on ultrawide (1921px+) */}
            <div className="columns-2 gap-1 sm:gap-1.5 md:columns-3 lg:columns-4 3xl:columns-5">
                {images.map((image, index) => (
                    <GalleryImageCard key={image.id} image={image} index={index} />
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
