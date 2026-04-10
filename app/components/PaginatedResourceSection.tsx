/**
 * @fileoverview Paginated resource section with load previous/more buttons
 *
 * @description
 * PaginatedResourceSection provides bi-directional pagination for Shopify resources
 * (products, collections, articles, etc.). Uses Hydrogen's Pagination component for
 * GraphQL cursor-based pagination with URL state management.
 *
 * @features
 * - Bi-directional pagination (load previous + load more)
 * - Cursor-based pagination via Hydrogen Pagination
 * - Loading states with spinner
 * - Accessible navigation with ARIA labels
 * - Touch-friendly button sizes (44px minimum)
 * - Render prop pattern for flexible item rendering
 * - Optional resource wrapper className
 *
 * @props
 * - connection: Shopify GraphQL connection with nodes and pageInfo
 * - children: Render function for each item (receives {node, index})
 * - resourcesClassName: Optional CSS classes for items wrapper
 *
 * @architecture
 * Uses Hydrogen's Pagination component which:
 * - Manages cursor-based pagination state
 * - Provides PreviousLink and NextLink components
 * - Updates URL with pagination cursors
 * - Handles loading states
 * - Automatically fetches pages on link click
 *
 * Pagination pattern:
 * - Load Previous button above items
 * - Items grid/list in middle
 * - Load More button below items
 * - Buttons show spinner during loading
 *
 * @accessibility
 * - ARIA labels on navigation regions
 * - Loading state announced to screen readers
 * - 44px minimum touch targets for mobile
 * - Keyboard navigation support
 *
 * @related
 * - @shopify/hydrogen Pagination - Core pagination logic
 * - InfiniteScrollSection.tsx - Alternative with auto-scroll loading
 * - InfiniteScrollGrid.tsx - Alternative with fetcher-based loading
 *
 * @example
 * ```tsx
 * <PaginatedResourceSection
 *   connection={products}
 *   resourcesClassName="grid grid-cols-2 md:grid-cols-3 gap-4"
 * >
 *   {({node: product, index}) => (
 *     <ProductCard product={product} index={index} />
 *   )}
 * </PaginatedResourceSection>
 * ```
 */

import * as React from "react";
import {Pagination} from "@shopify/hydrogen";
import {ChevronDownIcon, ChevronUpIcon} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Spinner} from "~/components/ui/spinner";

// ================================================================================
// Paginated Resource Component
// ================================================================================

/**
 * PaginatedResourceSection - Bi-directional pagination with load buttons
 *
 * Generic component for paginating any Shopify resource type.
 * Displays "Load previous" and "Load more" buttons with loading states.
 *
 * Type parameter:
 * - NodesType: Type of items in the connection (Product, Collection, etc.)
 *
 * Pagination behavior:
 * - Clicking "Load previous" prepends items to the list
 * - Clicking "Load more" appends items to the list
 * - URL updates with cursor for proper back/forward navigation
 * - Loading state shows spinner in place of button text
 *
 * @param connection - GraphQL connection with nodes and pageInfo
 * @param children - Render function for each item
 * @param resourcesClassName - Optional wrapper class for items
 */
export function PaginatedResourceSection<NodesType>({
    connection,
    children,
    resourcesClassName
}: {
    connection: React.ComponentProps<typeof Pagination<NodesType>>["connection"];
    children: (props: {node: NodesType; index: number}) => React.ReactElement;
    resourcesClassName?: string;
}) {
    return (
        <Pagination connection={connection}>
            {({nodes, isLoading, PreviousLink, NextLink}) => {
                const resourcesMarkup = nodes.map((node, index) => children({node, index}));

                return (
                    <div className="flex flex-col gap-4 sm:gap-6">
                        {/* Load Previous */}
                        <nav className="flex justify-center" aria-label="Load previous items">
                            <Button variant="outline" size="default" asChild className="min-w-36 sm:min-w-40">
                                <PreviousLink aria-label={isLoading ? "Loading previous items" : "Load previous items"}>
                                    {isLoading ? (
                                        <Spinner className="size-4" aria-hidden="true" />
                                    ) : (
                                        <>
                                            <ChevronUpIcon className="size-4" aria-hidden="true" />
                                            <span>Load previous</span>
                                        </>
                                    )}
                                </PreviousLink>
                            </Button>
                        </nav>

                        {/* Resource Items */}
                        {resourcesClassName ? (
                            <div className={resourcesClassName}>{resourcesMarkup}</div>
                        ) : (
                            resourcesMarkup
                        )}

                        {/* Load More */}
                        <nav className="flex justify-center" aria-label="Load more items">
                            <Button variant="outline" size="default" asChild className="min-w-36 sm:min-w-40">
                                <NextLink aria-label={isLoading ? "Loading more items" : "Load more items"}>
                                    {isLoading ? (
                                        <Spinner className="size-4" aria-hidden="true" />
                                    ) : (
                                        <>
                                            <span>Load more</span>
                                            <ChevronDownIcon className="size-4" aria-hidden="true" />
                                        </>
                                    )}
                                </NextLink>
                            </Button>
                        </nav>
                    </div>
                );
            }}
        </Pagination>
    );
}
