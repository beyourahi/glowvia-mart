/**
 * @fileoverview Shared Wishlist Route
 *
 * @description
 * Public-facing route for viewing shared wishlists. Allows users to browse products
 * that someone has shared via a shareable link and save them to their own wishlist.
 * This route is completely server-side rendered with no localStorage dependency.
 *
 * Features:
 * - Server-side product fetching from encoded URL parameter (no client-side state)
 * - "Save to My Wishlist" and "Save All" CTAs for visitors
 * - Responsive grid layout matching main wishlist design
 * - SEO-friendly with dynamic meta tags (count, description)
 * - Error handling for invalid/empty shared links
 * - Empty state with call-to-action to browse products
 * - Toast notifications for save actions
 * - Limit of 50 products to prevent URL abuse
 *
 * @route /wishlist/share?ids={encodedIds}
 *
 * @architecture
 * - URL parameter `ids` contains base64-encoded numeric product IDs
 * - Decodes IDs, reconstructs Shopify GIDs, fetches products via Storefront API
 * - Uses ProductItem component for consistent product card display
 * - Integrates with wishlist context for saving products to user's local wishlist
 * - No authentication required (public route)
 * - Gracefully handles deleted products (filters out null nodes)
 *
 * @dependencies
 * - ~/lib/wishlist-utils - Encoding/decoding utilities for shareable URLs
 * - ~/lib/wishlist-context - Client-side wishlist state management
 * - ~/lib/seo - SEO utilities for canonical URLs
 * - ~/components/ProductItem - Product card component
 *
 * @related
 * - ~/routes/wishlist.tsx - Main wishlist route with share functionality
 * - ~/lib/wishlist-utils - Shared wishlist encoding/decoding utilities
 * - ~/lib/wishlist-context - Wishlist state management context
 * - ~/components/ProductItem - Product card display component
 */

import {Link, useLoaderData} from "react-router";
import {getSeoMeta} from "@shopify/hydrogen";
import {Heart, ShoppingBag, Plus} from "lucide-react";
import type {Route} from "./+types/wishlist_.share";
import type {ProductItemFragment} from "storefrontapi.generated";
import {decodeWishlistIds, reconstructGids} from "~/lib/wishlist-utils";
import {useWishlist} from "~/lib/wishlist-context";
import {ProductItem} from "~/components/ProductItem";
import {Button} from "~/components/ui/button";
import {buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {toast} from "sonner";

// =============================================================================
// META & LOADER
// =============================================================================

export const meta: Route.MetaFunction = ({data, matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const count = data?.products?.length ?? 0;
    return (
        getSeoMeta({
            title: `Shared Wishlist (${count} items)`,
            description: `Someone shared their wishlist with you! Browse ${count} curated product${count !== 1 ? "s" : ""}.`,
            url: buildCanonicalUrl("/wishlist/share", siteUrl)
        }) ?? []
    );
};

export async function loader({request, context}: Route.LoaderArgs) {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const encodedIds = url.searchParams.get("ids") || "";

    // Decode IDs from URL
    const numericIds = decodeWishlistIds(encodedIds);

    if (numericIds.length === 0) {
        return {products: [], numericIds: [], error: "No products in shared wishlist"};
    }

    // Convert to GIDs and fetch products
    const gids = reconstructGids(numericIds);
    const limitedGids = gids.slice(0, 50); // Limit to prevent abuse

    try {
        const response = await dataAdapter.query(SHARED_WISHLIST_QUERY, {
            variables: {ids: limitedGids}
        });

        const {nodes} = response;

        // Filter out null nodes (deleted products)
        const products = nodes.filter(
            (node: any): node is ProductItemFragment => node !== null && node.__typename === "Product"
        );

        return {products, numericIds, error: null};
    } catch (error) {
        console.error("[Shared Wishlist] Error:", error);
        return {products: [], numericIds, error: "Failed to load shared wishlist"};
    }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SharedWishlistPage() {
    const {products, numericIds, error} = useLoaderData<typeof loader>();
    const wishlist = useWishlist();

    const handleSaveAll = () => {
        let addedCount = 0;
        numericIds.forEach(id => {
            const gid = `gid://shopify/Product/${id}`;
            if (!wishlist.has(gid)) {
                wishlist.add(gid);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            toast.success(`Added ${addedCount} item${addedCount !== 1 ? "s" : ""} to your wishlist`, {
                description: "View your wishlist to see all saved items"
            });
        } else {
            toast.info("All items already in your wishlist");
        }
    };

    // Error state
    if (error && products.length === 0) {
        return (
            <div className="mx-2 md:mx-4 mb-4  ">
                <SharedWishlistHeader count={0} />
                <SharedWishlistEmpty />
            </div>
        );
    }

    return (
        <div className="mx-2 md:mx-4 mb-4  ">
            <SharedWishlistHeader count={products.length} onSaveAll={handleSaveAll} />

            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    {(products as ProductItemFragment[]).map((product, index) => (
                        <ProductItem
                            key={product.id}
                            product={product}
                            loading={index < 4 ? "eager" : "lazy"}
                            index={index}
                            gridColumns={4}
                        />
                    ))}
                </div>
            ) : (
                <SharedWishlistEmpty />
            )}

            {/* Bottom CTA */}
            {products.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 border-t border-primary/10">
                    <p className="text-muted-foreground text-center">
                        Like what you see? Save these items to your own wishlist.
                    </p>
                    <Button type="button" onClick={handleSaveAll}>
                        <Plus className="size-4" />
                        Save All to My Wishlist
                    </Button>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// HEADER
// =============================================================================

function SharedWishlistHeader({count, onSaveAll}: {count: number; onSaveAll?: () => void}) {
    return (
        // pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px)
        <header className="pt-(--page-breathing-room) pb-8 md:pb-12">
            <div className="flex items-center justify-between">
                <div>
                    {/* Shared badge */}
                    <span className="inline-block mb-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        Shared Wishlist
                    </span>
                    <h1 className="font-serif text-xl font-medium text-primary md:text-3xl lg:text-4xl mb-0 mt-0">
                        Wishlist
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground md:text-lg">
                        {count === 0
                            ? "No items in this wishlist"
                            : `${count} ${count === 1 ? "item" : "items"} shared`}
                    </p>
                </div>

                {/* Save All Button - Desktop */}
                {count > 0 && onSaveAll && (
                    <Button
                        type="button"
                        size="lg"
                        onClick={onSaveAll}
                        className="hidden sm:inline-flex text-sm"
                    >
                        <Plus className="size-5" />
                        Save All
                    </Button>
                )}
            </div>

            {/* Save All Button - Mobile */}
            {count > 0 && onSaveAll && (
                <div className="mt-4 sm:hidden">
                    <Button type="button" onClick={onSaveAll}>
                        <Plus className="size-4" />
                        Save All to My Wishlist
                    </Button>
                </div>
            )}
        </header>
    );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function SharedWishlistEmpty() {
    return (
        // pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px)
        <div className="flex flex-col items-center justify-center pt-(--page-breathing-room) pb-16 sm:pb-24 lg:pb-32 text-center">
            <div className="mb-8">
                <Heart className="size-20 sm:size-24 text-muted-foreground/30" strokeWidth={1} />
            </div>

            <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-medium text-primary mb-4">
                This wishlist is empty
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground max-w-md mb-8 px-4">
                The shared wishlist does not contain any products, or the link may be invalid.
            </p>

            <Button asChild size="lg" className="text-base sm:text-lg">
                <Link to="/collections/all-products">
                    <ShoppingBag className="size-5" />
                    Browse Products
                </Link>
            </Button>
        </div>
    );
}

// =============================================================================
// GRAPHQL QUERY
// =============================================================================

const SHARED_WISHLIST_QUERY = `#graphql
    fragment SharedWishlistProduct on Product {
        __typename
        id
        title
        handle
        availableForSale
        featuredImage {
            id
            url
            altText
            width
            height
        }
        images(first: 4) {
            nodes {
                id
                url
                altText
                width
                height
            }
        }
        priceRange {
            minVariantPrice {
                amount
                currencyCode
            }
            maxVariantPrice {
                amount
                currencyCode
            }
        }
        compareAtPriceRange {
            minVariantPrice {
                amount
                currencyCode
            }
        }
        variants(first: 100) {
            nodes {
                id
                title
                availableForSale
                selectedOptions {
                    name
                    value
                }
                price {
                    amount
                    currencyCode
                }
                compareAtPrice {
                    amount
                    currencyCode
                }
            }
        }
    }

    query SharedWishlistProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
            ... on Product {
                ...SharedWishlistProduct
            }
        }
    }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
