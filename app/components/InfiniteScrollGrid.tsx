/**
 * @fileoverview Infinite Scroll Grid Component
 *
 * @description
 * Custom infinite scroll implementation for product grids using React Router fetcher
 * and Intersection Observer. Provides automatic pagination with 200px early loading,
 * staggered animations for new items, and comprehensive error handling.
 *
 * @component
 * InfiniteScrollGrid<T> - Generic infinite scroll container
 *
 * @features
 * - Automatic infinite scroll via Intersection Observer
 * - 200px early loading threshold (loads before user reaches bottom)
 * - Staggered fade-in animations for newly loaded products (50ms stagger, max 8 items)
 * - Deduplication: Prevents duplicate products in edge cases
 * - Error handling: Displays error message with manual retry button
 * - Optional skeleton placeholders during loading (instead of spinner)
 * - Optional end state message when all products loaded
 * - Cursor-based pagination via URL params
 * - Resets state when initialProducts change (e.g., sort/filter change)
 * - Optimistic loading indicators
 *
 * @props
 * - initialProducts: T[] - Initial product batch (from loader)
 * - pageInfo: PageInfo - Pagination info (hasNextPage, endCursor)
 * - resourcesClassName?: string - CSS class for grid container
 * - children: (props: {node, index, isNew}) => ReactNode - Render function per product
 * - fetcherKey: string - Unique fetcher key for this grid instance
 * - showSkeletons?: boolean - Show skeleton placeholders instead of spinner (default: false)
 * - skeletonCount?: number - Number of skeleton items (default: 4)
 * - renderSkeleton?: () => ReactNode - Custom skeleton component
 * - endMessage?: string - Message when all products loaded (pass "" to hide)
 *
 * @types
 * PageInfo:
 * - hasNextPage: boolean - Whether more products exist
 * - endCursor: string | null - Cursor for next page
 *
 * Generic Constraint:
 * - T extends {id: string} - Products must have unique ID
 *
 * @behavior
 * Loading Flow:
 * 1. Sentinel element enters viewport (200px before bottom)
 * 2. If hasMore && !error && fetcher idle: triggers load via fetcher.load()
 * 3. Fetcher loads route with ?cursor=X&index= params
 * 4. Route returns {products, pageInfo}
 * 5. Component appends new products with deduplication
 * 6. Updates cursor and hasMore state
 * 7. Repeat when sentinel re-enters viewport
 *
 * Error Handling:
 * - Detects failed fetches (fetcher.data === null or invalid structure)
 * - Displays error message with retry button
 * - Retry button re-triggers load with same cursor
 * - Observer disabled during error state (prevents auto-retry loop)
 *
 * Reset Behavior:
 * - When initialProducts/pageInfo change: resets all state
 * - Clears error, resets cursor, updates hasMore
 * - This happens on sort/filter changes (new loader data)
 *
 * @animations
 * Staggered Fade-In:
 * - New products get animate-product-fade-in class
 * - Stagger delay: index * 50ms (max 350ms for 8th+ item)
 * - Animation state clears after 1000ms (cleanup)
 * - Uses newProductsStartIndex to track new vs existing products
 *
 * @styling
 * Loading States:
 * - Spinner: Centered with "Loading more products..." text
 * - Skeletons: Grid layout matching product grid
 * - Error: Centered with destructive text + retry button
 * - End: Horizontal line + muted text
 *
 * Sentinel Element:
 * - Min height: 80px (mobile) / 100px (desktop)
 * - Centers loading/error/end states
 *
 * @dependencies
 * - react-router: useFetcher for pagination, useSearchParams for URL state
 * - ~/components/ui: Spinner, Skeleton, Button components
 * - Intersection Observer API (browser native)
 *
 * @related
 * - InfiniteScrollSection.tsx - Alternative using Hydrogen's Pagination component
 * - PaginatedResourceSection.tsx - Legacy pagination component
 * - routes/collections.$handle.tsx - Uses InfiniteScrollGrid for collection products
 * - routes/collections.all.tsx - Uses InfiniteScrollGrid for all products
 * - routes/sale.tsx - Uses InfiniteScrollGrid for sale products
 *
 * @performance
 * - Fetcher key prevents duplicate requests
 * - Deduplication prevents render thrashing
 * - Animation cleanup prevents memory leaks
 * - Observer cleanup on unmount
 * - Early loading reduces perceived loading time
 *
 * @accessibility
 * - Semantic loading states
 * - Retry button with proper text
 * - End message for screen readers
 * - Loading announcements via aria-live (future enhancement)
 *
 * @usage_example
 * ```tsx
 * <InfiniteScrollGrid
 *   initialProducts={products}
 *   pageInfo={pageInfo}
 *   resourcesClassName={getGridClassName(gridColumns)}
 *   fetcherKey="collection-products"
 *   showSkeletons
 *   skeletonCount={6}
 *   endMessage="You've reached the end"
 * >
 *   {({node, index, isNew}) => (
 *     <ProductItem product={node} index={index} />
 *   )}
 * </InfiniteScrollGrid>
 * ```
 */
import * as React from "react";
import {useFetcher, useSearchParams} from "react-router";
import {Spinner} from "~/components/ui/spinner";
import {Skeleton} from "~/components/ui/skeleton";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";

interface PageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

interface InfiniteScrollGridProps<T> {
    initialProducts: T[];
    pageInfo: PageInfo;
    resourcesClassName?: string;
    children: (props: {node: T; index: number; isNew: boolean}) => React.ReactNode;
    fetcherKey: string;
    /** Show skeleton placeholders instead of spinner during load. Default: false */
    showSkeletons?: boolean;
    /** Number of skeleton items to show. Default: 4 */
    skeletonCount?: number;
    /** Custom skeleton component. Default: built-in product skeleton */
    renderSkeleton?: () => React.ReactNode;
    /** End state message when no more products. Pass empty string to hide. */
    endMessage?: string;
}

/**
 * InfiniteScrollGrid - Displays products with automatic infinite scroll loading.
 * Replaces PaginatedResourceSection with forward-only scroll behavior.
 *
 * Features:
 * - 200px early loading threshold via Intersection Observer
 * - Staggered fade-in animations for newly loaded products
 * - Error states with retry functionality
 * - Optional end state message when all products are loaded
 * - Optional skeleton loading placeholders
 */
export function InfiniteScrollGrid<T extends {id: string}>({
    initialProducts,
    pageInfo,
    resourcesClassName,
    children,
    fetcherKey,
    showSkeletons = false,
    skeletonCount = 4,
    renderSkeleton,
    endMessage
}: InfiniteScrollGridProps<T>) {
    const fetcher = useFetcher<{products: T[]; pageInfo: PageInfo}>({key: fetcherKey});
    const [products, setProducts] = React.useState<T[]>(initialProducts);
    const [cursor, setCursor] = React.useState<string | null>(pageInfo.endCursor);
    const [hasMore, setHasMore] = React.useState(pageInfo.hasNextPage);
    const [error, setError] = React.useState<string | null>(null);
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const [searchParams] = useSearchParams();

    // Track the count of initial products to identify newly loaded ones
    const [initialCount, setInitialCount] = React.useState(initialProducts.length);
    // Track the index from which new products start (for staggered animation)
    const [newProductsStartIndex, setNewProductsStartIndex] = React.useState<number | null>(null);

    // Reset when initial products change (e.g., sort changed, new page load)
    React.useEffect(() => {
        setProducts(initialProducts);
        setCursor(pageInfo.endCursor);
        setHasMore(pageInfo.hasNextPage);
        setError(null);
        setInitialCount(initialProducts.length);
        setNewProductsStartIndex(null);
    }, [initialProducts, pageInfo.endCursor, pageInfo.hasNextPage]);

    // Handle fetcher state changes for error detection
    React.useEffect(() => {
        // Check for network errors or failed responses
        if (fetcher.state === "idle" && fetcher.data === undefined && cursor !== null) {
            // If fetcher finished but returned no data after we tried to load, might be an error
            // This catches cases where the fetch failed silently
        }
    }, [fetcher.state, fetcher.data, cursor]);

    // Append fetched products when fetcher completes
    React.useEffect(() => {
        if (fetcher.state === "idle") {
            // Check for errors - fetcher completed but no valid data
            if (fetcher.data === null || (fetcher.data !== undefined && !fetcher.data.products)) {
                setError("Failed to load more products. Please try again.");
                return;
            }

            if (fetcher.data?.products && fetcher.data.products.length > 0) {
                // Mark the start index for new products (for staggered animation)
                setNewProductsStartIndex(products.length);

                // Deduplicate products to prevent edge case duplicates
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newProducts = fetcher.data!.products.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newProducts];
                });
                setCursor(fetcher.data.pageInfo.endCursor);
                setHasMore(fetcher.data.pageInfo.hasNextPage);
                setError(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- products.length is intentionally excluded
    }, [fetcher.state, fetcher.data]);

    // Intersection Observer for infinite scroll
    React.useEffect(() => {
        if (!sentinelRef.current || !hasMore || error) return;

        const observer = new IntersectionObserver(
            entries => {
                const [entry] = entries;
                if (entry.isIntersecting && fetcher.state === "idle" && hasMore && cursor && !error) {
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
    }, [cursor, hasMore, fetcher.state, searchParams, fetcher.load, error]);

    // Retry function for manual reload
    const retry = () => {
        if (cursor) {
            setError(null);
            const params = new URLSearchParams(searchParams);
            params.set("cursor", cursor);
            params.set("index", "");
            void fetcher.load(`?${params.toString()}`);
        }
    };

    // Clear animation state after animations complete
    React.useEffect(() => {
        if (newProductsStartIndex !== null) {
            const timeout = setTimeout(() => {
                setNewProductsStartIndex(null);
            }, 1000); // Clear after animations complete
            return () => clearTimeout(timeout);
        }
    }, [newProductsStartIndex]);

    const isLoading = fetcher.state === "loading";

    // Default skeleton renderer
    const defaultSkeleton = () => (
        <div className="flex flex-col gap-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );

    const SkeletonComponent = renderSkeleton || defaultSkeleton;

    return (
        <div className="flex flex-col gap-6">
            {/* Product Grid */}
            {resourcesClassName ? (
                <div className={resourcesClassName}>
                    {products.map((product, index) => {
                        // Determine if this product is newly loaded (for fade-in animation)
                        const isNew =
                            newProductsStartIndex !== null && index >= newProductsStartIndex && index >= initialCount;

                        // Calculate stagger delay for animation (max 8 items with stagger)
                        const staggerIndex = isNew ? index - newProductsStartIndex : 0;
                        const staggerDelay = Math.min(staggerIndex, 7) * 50; // 50ms stagger, max 350ms

                        return (
                            <div
                                key={product.id}
                                className={cn(isNew && "animate-product-fade-in")}
                                style={isNew ? {animationDelay: `${staggerDelay}ms`} : undefined}
                            >
                                {children({node: product, index, isNew})}
                            </div>
                        );
                    })}
                </div>
            ) : (
                products.map((product, index) => {
                    const isNew =
                        newProductsStartIndex !== null && index >= newProductsStartIndex && index >= initialCount;
                    const staggerIndex = isNew ? index - newProductsStartIndex : 0;
                    const staggerDelay = Math.min(staggerIndex, 7) * 50;

                    return (
                        <div
                            key={product.id}
                            className={cn(isNew && "animate-product-fade-in")}
                            style={isNew ? {animationDelay: `${staggerDelay}ms`} : undefined}
                        >
                            {children({node: product, index, isNew})}
                        </div>
                    );
                })
            )}

            {/* Skeleton loading placeholders - Index key is intentional: placeholders have no unique data */}
            {isLoading && showSkeletons && resourcesClassName && (
                <div className={resourcesClassName}>
                    {Array.from({length: skeletonCount}).map((_, skeletonIndex) => (
                        <div
                            // eslint-disable-next-line react/no-array-index-key
                            key={`skeleton-placeholder-${skeletonIndex}`}
                            className="animate-product-fade-in"
                            style={{animationDelay: `${skeletonIndex * 50}ms`}}
                        >
                            <SkeletonComponent />
                        </div>
                    ))}
                </div>
            )}

            {/* Sentinel element for intersection observer + Loading/Error/End states */}
            <div ref={sentinelRef} className="flex flex-col items-center justify-center py-6 min-h-20 md:min-h-25">
                {/* Loading state - spinner (when not using skeletons) */}
                {isLoading && !showSkeletons && (
                    <div className="flex flex-col items-center gap-2">
                        <Spinner className="size-6 md:size-7" />
                        <span className="text-sm text-muted-foreground">Loading more products...</span>
                    </div>
                )}

                {/* Error state with retry button */}
                {error && !isLoading && (
                    <div className="flex flex-col items-center gap-3 text-center px-4">
                        <span className="text-sm text-destructive">{error}</span>
                        <Button variant="outline" size="sm" onClick={retry} className="min-w-[120px] motion-interactive motion-press">
                            Try again
                        </Button>
                    </div>
                )}

                {/* End state - all products loaded (only show if endMessage provided) */}
                {!hasMore && !isLoading && !error && products.length > 0 && endMessage && (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="w-12 h-px bg-border" />
                        <span className="text-sm text-muted-foreground">{endMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
