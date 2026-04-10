/**
 * @fileoverview Infinite Scroll Section Component (Hydrogen Pattern)
 *
 * @description
 * Official Shopify Hydrogen-based infinite scroll implementation using the Pagination
 * component with react-intersection-observer. Provides automatic pagination by navigating
 * to next page URL when "Load more" link enters viewport. Uses replace mode to preserve
 * browser history.
 *
 * @components
 * - InfiniteScrollSection<T> - Main infinite scroll wrapper
 * - PaginationContent<T> - Internal render component (allows hooks usage)
 * - ItemsGrid<T> - Internal grid with auto-navigation logic
 *
 * @features
 * - Auto-loads when "Load more" link enters viewport (configurable threshold)
 * - Browser history-friendly: uses navigate replace mode
 * - Staggered fade-in animations for newly loaded items (50ms stagger, max 8 items)
 * - Optional skeleton placeholders during loading
 * - Optional end state message when all items loaded
 * - Hidden "Previous" link for accessibility (supports back navigation)
 * - Compatible with any GraphQL Connection pattern
 * - Generic implementation: works with products, articles, etc.
 *
 * @props
 * InfiniteScrollSection:
 * - connection: Connection<T> - GraphQL connection (nodes + pageInfo)
 * - resourcesClassName?: string - CSS class for grid container
 * - children: (props: {node, index}) => ReactNode - Render function per item
 * - showSkeletons?: boolean - Show skeleton placeholders (default: false)
 * - skeletonCount?: number - Number of skeleton items (default: 4)
 * - renderSkeleton?: () => ReactNode - Custom skeleton component
 * - endMessage?: string - Message when all items loaded (pass "" to hide)
 * - threshold?: string - Intersection Observer rootMargin (default: "200px")
 *
 * @types
 * Connection<T>:
 * - nodes: T[] - Array of items
 * - pageInfo: PageInfo - Pagination metadata
 *   - hasNextPage: boolean
 *   - hasPreviousPage: boolean
 *   - startCursor?: string | null
 *   - endCursor?: string | null
 *
 * Generic Constraint:
 * - T extends {id: string} - Items must have unique ID
 *
 * @behavior
 * Official Hydrogen Pattern:
 * 1. Pagination component manages state (nodes, isLoading, NextLink, etc.)
 * 2. NextLink component rendered with ref for intersection observer
 * 3. When NextLink enters viewport (via threshold): navigate(nextPageUrl)
 * 4. Navigation uses replace mode + preventScrollReset
 * 5. Route loader returns updated connection with accumulated nodes
 * 6. Pagination component re-renders with new nodes appended
 * 7. Repeat when NextLink re-enters viewport
 *
 * This follows the official Shopify Hydrogen example:
 * https://github.com/Shopify/hydrogen/tree/main/examples/infinite-scroll
 *
 * @animations
 * Staggered Fade-In:
 * - Tracks previousNodesCount to identify new items
 * - New items get animate-product-fade-in class
 * - Stagger delay: index * 50ms (max 350ms for 8th+ item)
 * - isNewBatch flag triggers animation for entire new batch
 *
 * @styling
 * Loading States:
 * - Spinner: Centered with "Loading more..." text
 * - Skeletons: Grid layout matching item grid
 * - End: Horizontal line + muted text
 *
 * Sentinel Element:
 * - Min height: 80px (mobile) / 100px (desktop)
 * - Centers loading/end states
 * - Contains NextLink for intersection observer
 *
 * @dependencies
 * - @shopify/hydrogen: Pagination component
 * - react-intersection-observer: useInView hook for viewport detection
 * - react-router: useNavigate for URL-based pagination
 * - ~/components/ui: Spinner, Skeleton components
 *
 * @related
 * - InfiniteScrollGrid.tsx - Custom fetcher-based infinite scroll
 * - PaginatedResourceSection.tsx - Legacy pagination component
 * - routes/blogs.$blogHandle._index.tsx - Uses for article listings
 * - routes/search.tsx - Could use for search results pagination
 *
 * @advantages_over_custom
 * - Official Hydrogen pattern: better long-term support
 * - Cleaner API: Pagination handles state management
 * - Better SSR: Connection pattern standard in GraphQL
 * - Simpler implementation: Less custom state management
 *
 * @disadvantages_vs_custom
 * - Less control over error states (no built-in retry)
 * - Requires Connection pattern (not compatible with all APIs)
 * - Navigation-based (slightly more complex debugging)
 *
 * @accessibility
 * - Semantic nav elements with aria-labels
 * - Hidden "Previous" link for back navigation
 * - "Load more" link accessible to screen readers
 * - End message for completion state
 *
 * @usage_example
 * ```tsx
 * <InfiniteScrollSection
 *   connection={products}
 *   resourcesClassName={getGridClassName(gridColumns)}
 *   showSkeletons
 *   skeletonCount={6}
 *   endMessage="All products loaded"
 *   threshold="200px"
 * >
 *   {({node, index}) => (
 *     <ProductItem product={node} index={index} />
 *   )}
 * </InfiniteScrollSection>
 * ```
 */
import * as React from "react";
import {useNavigate} from "react-router";
import {Pagination} from "@shopify/hydrogen";
import {useInView} from "react-intersection-observer";
import {Spinner} from "~/components/ui/spinner";
import {Skeleton} from "~/components/ui/skeleton";
import {cn} from "~/lib/utils";

type Connection<T> = {
    nodes: T[];
    pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: string | null;
        endCursor?: string | null;
    };
};

interface InfiniteScrollSectionProps<T> {
    /** The connection object from GraphQL query (includes nodes and pageInfo) */
    connection: Connection<T>;
    /** CSS class for the grid container */
    resourcesClassName?: string;
    /** Render function for each item */
    children: (props: {node: T; index: number}) => React.ReactNode;
    /** Show skeleton placeholders instead of spinner during load. Default: false */
    showSkeletons?: boolean;
    /** Number of skeleton items to show. Default: 4 */
    skeletonCount?: number;
    /** Custom skeleton component. Default: built-in product skeleton */
    renderSkeleton?: () => React.ReactNode;
    /** End state message when no more items. Pass empty string to hide. */
    endMessage?: string;
    /** Root margin for Intersection Observer. Default: "200px" */
    threshold?: string;
    /**
     * Optional function to sort/transform nodes before rendering.
     * Useful for client-side sorting that can't be done server-side
     * (e.g., prioritizing pinned products at the top).
     */
    sortNodes?: (nodes: T[]) => T[];
}

/**
 * InfiniteScrollSection - Displays items with automatic infinite scroll loading
 * following the official Shopify Hydrogen pattern.
 *
 * Uses:
 * - react-intersection-observer for viewport detection
 * - Hydrogen's Pagination component for state management
 * - useNavigate for URL-based pagination (replace mode)
 *
 * Features:
 * - Auto-loads more items when "Load more" enters viewport
 * - Preserves browser history with replace mode
 * - Staggered fade-in animations for newly loaded items
 * - Optional skeleton loading placeholders
 * - End state message when all items are loaded
 */
export function InfiniteScrollSection<T extends {id: string}>({
    connection,
    resourcesClassName,
    children,
    showSkeletons = false,
    skeletonCount = 4,
    renderSkeleton,
    endMessage,
    threshold = "200px",
    sortNodes
}: InfiniteScrollSectionProps<T>) {
    const {ref, inView} = useInView({
        rootMargin: threshold,
        triggerOnce: false
    });

    // Track previous nodes count for animation purposes
    const previousNodesCountRef = React.useRef(0);

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
        <Pagination connection={connection}>
            {({nodes, isLoading, PreviousLink, NextLink, state, nextPageUrl, hasNextPage}) => {
                // Apply optional client-side sorting (e.g., pin sorting)
                const sortedNodes = sortNodes ? sortNodes(nodes) : nodes;

                return (
                    <PaginationContent<T>
                        nodes={sortedNodes}
                        isLoading={isLoading}
                        PreviousLink={PreviousLink}
                        NextLink={NextLink}
                        state={state}
                        nextPageUrl={nextPageUrl}
                        hasNextPage={hasNextPage}
                        inView={inView}
                        intersectionRef={ref}
                        resourcesClassName={resourcesClassName}
                        previousNodesCountRef={previousNodesCountRef}
                        showSkeletons={showSkeletons}
                        skeletonCount={skeletonCount}
                        SkeletonComponent={SkeletonComponent}
                        endMessage={endMessage}
                    >
                        {children}
                    </PaginationContent>
                );
            }}
        </Pagination>
    );
}

/**
 * PaginationContent - Internal component that handles the pagination UI.
 * Extracted to allow proper React hooks usage.
 */
function PaginationContent<T extends {id: string}>({
    nodes,
    isLoading,
    PreviousLink,
    NextLink,
    state,
    nextPageUrl,
    hasNextPage,
    inView,
    intersectionRef,
    resourcesClassName,
    previousNodesCountRef,
    showSkeletons,
    skeletonCount,
    SkeletonComponent,
    endMessage,
    children
}: {
    nodes: T[];
    isLoading: boolean;
    PreviousLink: React.ComponentType<{children: React.ReactNode}>;
    NextLink: React.ForwardRefExoticComponent<
        {children: React.ReactNode; className?: string} & React.RefAttributes<HTMLAnchorElement>
    >;
    state: unknown;
    nextPageUrl: string;
    hasNextPage: boolean;
    inView: boolean;
    intersectionRef: (node?: Element | null) => void;
    resourcesClassName?: string;
    previousNodesCountRef: React.MutableRefObject<number>;
    showSkeletons: boolean;
    skeletonCount: number;
    SkeletonComponent: () => React.ReactNode;
    endMessage?: string;
    children: (props: {node: T; index: number}) => React.ReactNode;
}) {
    // Calculate which items are new for staggered animation
    const prevCount = previousNodesCountRef.current;
    const isNewBatch = nodes.length > prevCount;

    // Update ref after render (safe to use useEffect here in a component)
    React.useEffect(() => {
        previousNodesCountRef.current = nodes.length;
    }, [nodes.length, previousNodesCountRef]);

    return (
        <div className="flex flex-col gap-6">
            {/* Hidden Previous Link for accessibility and back navigation */}
            <nav className="sr-only" aria-label="Load previous items">
                <PreviousLink>Load previous</PreviousLink>
            </nav>

            {/* Items Grid with auto-scroll */}
            <ItemsGrid<T>
                nodes={nodes}
                inView={inView}
                hasNextPage={hasNextPage}
                nextPageUrl={nextPageUrl}
                state={state}
                resourcesClassName={resourcesClassName}
                previousNodesCount={prevCount}
                isNewBatch={isNewBatch}
            >
                {children}
            </ItemsGrid>

            {/* Skeleton loading placeholders - key uses index since skeletons are temporary placeholders */}
            {isLoading && showSkeletons && resourcesClassName && (
                <div className={resourcesClassName}>
                    {Array.from({length: skeletonCount}).map((_, skeletonIndex) => (
                        <div
                            // eslint-disable-next-line react/no-array-index-key -- Static skeleton placeholders
                            key={`skeleton-${skeletonIndex}`}
                            className="animate-product-fade-in"
                            style={{animationDelay: `${skeletonIndex * 50}ms`}}
                        >
                            <SkeletonComponent />
                        </div>
                    ))}
                </div>
            )}

            {/* Sentinel element + Loading/End states */}
            <div className="flex flex-col items-center justify-center py-6 min-h-20 md:min-h-25">
                {/* Loading state - spinner (when not using skeletons) */}
                {isLoading && !showSkeletons && (
                    <div className="flex flex-col items-center gap-2">
                        <Spinner className="size-6 md:size-7" />
                        <span className="text-sm text-muted-foreground">Loading more...</span>
                    </div>
                )}

                {/* Next Link with ref for intersection observer */}
                {hasNextPage && !isLoading && (
                    <nav aria-label="Load more items">
                        <NextLink ref={intersectionRef} className="text-sm text-muted-foreground hover:underline">
                            Load more
                        </NextLink>
                    </nav>
                )}

                {/* End state - all items loaded */}
                {!hasNextPage && !isLoading && nodes.length > 0 && endMessage && (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="w-12 h-px bg-border" />
                        <span className="text-sm text-muted-foreground">{endMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * ItemsGrid - Internal component that handles the auto-navigation
 * when items come into view. Following the official Shopify pattern.
 */
function ItemsGrid<T extends {id: string}>({
    nodes,
    inView,
    hasNextPage,
    nextPageUrl,
    state,
    resourcesClassName,
    previousNodesCount,
    isNewBatch,
    children
}: {
    nodes: T[];
    inView: boolean;
    hasNextPage: boolean;
    nextPageUrl: string;
    state: unknown;
    resourcesClassName?: string;
    previousNodesCount: number;
    isNewBatch: boolean;
    children: (props: {node: T; index: number}) => React.ReactNode;
}) {
    const navigate = useNavigate();

    // Auto-navigate when sentinel comes into view (official pattern)
    React.useEffect(() => {
        if (inView && hasNextPage) {
            void navigate(nextPageUrl, {
                replace: true,
                preventScrollReset: true,
                state
            });
        }
    }, [inView, navigate, state, nextPageUrl, hasNextPage]);

    // Render items with staggered animation for new batches
    const renderItems = () =>
        nodes.map((node, index) => {
            // Determine if this item is newly loaded (for fade-in animation)
            const isNew = isNewBatch && index >= previousNodesCount;

            // Calculate stagger delay for animation (max 8 items with stagger)
            const staggerIndex = isNew ? index - previousNodesCount : 0;
            const staggerDelay = Math.min(staggerIndex, 7) * 50; // 50ms stagger, max 350ms

            return (
                <div
                    key={node.id}
                    className={cn(isNew && "animate-product-fade-in")}
                    style={isNew ? {animationDelay: `${staggerDelay}ms`} : undefined}
                >
                    {children({node, index})}
                </div>
            );
        });

    if (resourcesClassName) {
        return <div className={resourcesClassName}>{renderItems()}</div>;
    }

    return <>{renderItems()}</>;
}
