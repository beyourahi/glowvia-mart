/**
 * @fileoverview Collections Index Page
 *
 * @description
 * Displays all store collections in a responsive grid layout.
 * Features hover effects with gradient overlays and smooth animations.
 * Supports infinite scroll pagination.
 *
 * Includes synthetic SALE collection that aggregates all discounted products.
 *
 * @route GET /collections
 *
 * @features
 * - Responsive grid layout (2-6 columns based on screen size)
 * - Infinite scroll pagination
 * - Staggered fade-in animations
 * - Loading skeleton states
 * - Hover effects with gradient overlays
 * - Asymmetric responsive gaps (8-20px horizontal, 12-24px vertical)
 * - Synthetic SALE collection (prepended if discounts exist)
 *
 * @sale-collection
 * The SALE collection is dynamically created in the loader:
 * - Fetches first 250 products with discount data
 * - Counts products with compareAtPrice > price
 * - Uses first discounted product's image as collection image
 * - Links to /sale route for full discount browsing experience
 * - Only shown if saleProductCount > 0
 *
 * @layout
 * Responsive Grid:
 * - Mobile (320px): 2 columns
 * - Small (640px): 3 columns
 * - Medium (768px): 4 columns
 * - Large (1024px): 5 columns
 * - XL+ (1280px+): 6 columns
 * - Hover: Gradient overlay reveals with text
 *
 * @pagination
 * Uses Hydrogen's cursor-based pagination with:
 * - 24 items per page
 * - Intersection observer trigger
 * - Auto-navigation on scroll
 *
 * @related
 * - collections.$handle.tsx - Individual collection page
 * - collections.all.tsx - All products page
 * - sale.tsx - SALE page with full discount filtering
 * - CollectionPageLayout.tsx - Product grid layout
 * - lib/gridColumns.ts - Grid utilities
 * - lib/discounts.ts - Discount calculation utilities
 *
 * @see https://shopify.dev/docs/api/storefront/latest/queries/collections
 */

import {useLoaderData, Link, useNavigate} from "react-router";
import * as React from "react";
import type {Route} from "./+types/collections._index";
import {Image, getSeoMeta, getPaginationVariables, Pagination} from "@shopify/hydrogen";
import {useInView} from "react-intersection-observer";
import type {CollectionFragment} from "storefrontapi.generated";
import {AnimatedSection} from "~/components/AnimatedSection";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {Skeleton} from "~/components/ui/skeleton";
import {countDiscountedProducts} from "~/lib/discounts";
import type {LightweightProduct} from "~/lib/discounts";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {cn} from "~/lib/utils";

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    return (
        getSeoMeta({
            title: "Collections",
            titleTemplate: `%s | ${brandName}`,
            description: "Explore our curated collections of handcrafted products, designed with care for you.",
            url: buildCanonicalUrl("/collections", siteUrl)
        }) ?? []
    );
};

export async function loader({context, request}: Route.LoaderArgs) {
    // Use official Hydrogen pagination pattern (24 items per page)
    const paginationVariables = getPaginationVariables(request, {pageBy: 24});

    // Fetch collections and discounted products in parallel
    const [{collections}, {products: discountedProducts}] = await Promise.all([
        // Collections list (real-time, no cache)
        context.dataAdapter.query(COLLECTIONS_QUERY, {
            variables: paginationVariables,
            cache: context.dataAdapter.CacheNone()
        }),
        // Discounted products for SALE collection (fetch first 250 to count and get image)
        context.dataAdapter.query(SALE_PRODUCTS_QUERY, {
            variables: {first: 250},
            cache: context.dataAdapter.CacheNone()
        })
    ]);

    return {collections, discountedProducts};
}

export default function Collections() {
    const {collections, discountedProducts} = useLoaderData<typeof loader>();
    const {ref, inView} = useInView({rootMargin: "200px"});

    // Count discounted products using the same logic as the sale page
    const saleProductCount = countDiscountedProducts(discountedProducts.nodes as LightweightProduct[]);
    const firstDiscountedProduct = discountedProducts.nodes.find((p: any) => p.featuredImage);

    // Filter to only products that have discounts (using same logic as countDiscountedProducts)
    const discountedProductsList = (discountedProducts.nodes as LightweightProduct[]).filter((p: any) => {
        // Check if any variant has a discount
        return p.variants.nodes.some((variant: any) => {
            if (!variant.availableForSale || !variant.compareAtPrice) return false;
            const compareAt = parseFloat(variant.compareAtPrice.amount);
            const current = parseFloat(variant.price.amount);
            return compareAt > current;
        });
    });

    // Create synthetic SALE collection
    const saleCollection: CollectionFragment = {
        id: "gid://shopify/Collection/sale",
        title: "SALE",
        handle: "sale",
        products: {
            nodes: discountedProductsList
                .slice(0, 250) // Include all discounted products (up to 250)
                .map((p: any) => ({id: p.id, availableForSale: true}))
        },
        image: firstDiscountedProduct?.featuredImage || null
    };

    // Calculate total collection count (including SALE if it exists)
    const totalCollectionCount = collections.nodes.length + (saleProductCount > 0 ? 1 : 0);

    return (
        <div className="mx-2 md:mx-4 mb-4 pb-16 md:pb-20 lg:pb-24  ">
            {/* Header Section
                 pt-(--page-breathing-room-dense): Extra breathing room for collections pages (40px → 96px) */}
            <AnimatedSection animation="fade" threshold={0.08}>
                <header className="pt-(--page-breathing-room-dense) pb-6 md:pb-8">
                    {/* Title with collection count superscript (matching menu style) */}
                    <div className="relative inline-block">
                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium text-primary tracking-tight my-0">
                            Collections
                        </h1>
                        {/* Collection count - positioned at top-right of title with small gap */}
                        <sup className="absolute top-0 left-[calc(100%+0.25rem)] sm:left-[calc(100%+0.5rem)] font-mono tabular-nums text-primary/60 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                            {totalCollectionCount}
                        </sup>
                    </div>
                    <p className="mt-3 md:mt-4 font-sans text-sm sm:text-base md:text-lg lg:text-xl text-primary/70 max-w-prose">
                        Explore our curated collections of handcrafted products, thoughtfully designed with care for
                        you.
                    </p>
                </header>
            </AnimatedSection>

            <Pagination connection={collections}>
                {({nodes, isLoading, NextLink, state, nextPageUrl, hasNextPage}) => (
                    <>
                        <AnimatedSection animation="slide-up" threshold={0.12}>
                            <CollectionsGrid
                                collections={
                                    saleProductCount > 0
                                        ? [saleCollection, ...(nodes as CollectionFragment[])]
                                        : (nodes as CollectionFragment[])
                                }
                                inView={inView}
                                hasNextPage={hasNextPage}
                                nextPageUrl={nextPageUrl}
                                state={state}
                            />
                        </AnimatedSection>

                        {/* Loading skeletons - responsive grid matching main layout */}
                        {isLoading && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-responsive gap-y-responsive-lg">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div
                                        key={`skeleton-${i}`}
                                        className="animate-product-fade-in"
                                        style={{animationDelay: `${i * 50}ms`}}
                                    >
                                        <Skeleton className="aspect-3/4 w-full rounded-2xl" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sentinel element */}
                        <div className="flex justify-center py-8 min-h-[60px]">
                            {hasNextPage && !isLoading && (
                                <NextLink ref={ref} className="sr-only">
                                    Load more collections
                                </NextLink>
                            )}
                        </div>
                    </>
                )}
            </Pagination>
        </div>
    );
}

/**
 * CollectionsGrid - Handles auto-navigation when sentinel comes into view
 * Uses responsive grid layout with 2-6 columns based on screen size
 */
function CollectionsGrid({
    collections,
    inView,
    hasNextPage,
    nextPageUrl,
    state
}: {
    collections: CollectionFragment[];
    inView: boolean;
    hasNextPage: boolean;
    nextPageUrl: string;
    state: unknown;
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

    if (collections.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-responsive gap-y-responsive-lg">
            {collections.map((collection, index) => (
                <CollectionCard key={collection.id} collection={collection} index={index} />
            ))}
        </div>
    );
}

/**
 * CollectionCard - Unified responsive card with hover effects
 * Shows title, product count overlay on all devices, with enhanced hover effect on desktop
 *
 * Hover strategy mirrors ProductItem:
 * - canHover guard ensures effects only fire on pointer/mouse devices
 * - Image scale via motion-image (transforms only — GPU-composited)
 * - Darkening via a separate opacity-transitioning overlay (motion-overlay handles opacity)
 * - "Explore" text fades in from opacity-0 (motion-overlay, opacity transition)
 * - Base gradient stays static — CSS cannot transition background-image
 */
function CollectionCard({collection, index}: {collection: CollectionFragment; index: number}) {
    const staggerDelay = index * 60;
    const {canHover} = usePointerCapabilities();

    // Calculate product count from fetched products (API already filters unavailable)
    const productCount = collection.products?.nodes?.length || 0;
    // Check if there might be more products than fetched (250 is API max)
    const hasMore = productCount >= 250;

    // Special handling for SALE collection - link directly to /sale instead of /collections/sale
    const linkTo = collection.handle === "sale" ? "/sale" : `/collections/${collection.handle}`;

    return (
        <Link
            to={linkTo}
            prefetch="viewport"
            className="group block no-underline animate-product-fade-in"
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="relative aspect-3/4 overflow-hidden rounded-2xl">
                {/* Background Image — uses same sleek + product-image classes as ProductImageCarousel:
                    sleek = transform-gpu + transition-all + duration-200ms
                    product-image = will-change:transform + translateZ(0) for GPU compositing
                    scale-[1.03] matches product card (subtle, not jarring) */}
                {collection?.image ? (
                    <Image
                        alt={collection.image.altText || collection.title}
                        data={collection.image}
                        loading={index < 12 ? "eager" : "lazy"}
                        sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="absolute inset-0 h-full w-full object-cover sleek product-image group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="absolute inset-0 bg-muted" />
                )}

                {/* Static gradient overlay — CSS cannot transition background-image */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/30 to-transparent" />

                {/* Text content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    {/* Title with product count as superscript (matching full-screen menu style) */}
                    <div className="flex items-baseline gap-1">
                        <h3 className="font-serif text-base font-medium text-light sm:text-lg md:text-xl">
                            {collection.title}
                        </h3>
                        <sup className="text-[10px] sm:text-xs text-light/60 font-mono tabular-nums">
                            {hasMore ? "250+" : productCount}
                        </sup>
                    </div>
                    {/* Explore hint — fades in from invisible on hover (pointer devices only) */}
                    <p className={cn(
                        "mt-1 text-xs text-light/80 sm:text-sm motion-overlay",
                        canHover ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                    )}>
                        Explore collection →
                    </p>
                </div>
            </div>
        </Link>
    );
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fetches collections with pagination.
 *
 * Includes minimal fields needed for cards:
 * - title, handle for links
 * - image for visual display
 * - products(first: 250) to count total products (API max limit)
 *
 * Note: Shopify Storefront API doesn't provide a direct count field,
 * so we fetch products to count them. Using first: 250 (max) to get
 * accurate counts for most collections.
 */
const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    products(first: 250) {
      nodes {
        id
      }
    }
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;

/**
 * Fetches products with discount information for SALE collection.
 *
 * Lightweight query that only fetches:
 * - Basic product info (id, availableForSale)
 * - Featured image for SALE collection card
 * - Variant pricing (price + compareAtPrice) to count discounts
 *
 * Used to create synthetic SALE collection with accurate product count
 * and first product image as collection image.
 */
const SALE_PRODUCTS_QUERY = `#graphql
  query SaleProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first, query: "available_for_sale:true") {
      nodes {
        id
        availableForSale
        featuredImage {
          id
          url
          altText
          width
          height
        }
        variants(first: 250) {
          nodes {
            availableForSale
            price {
              amount
            }
            compareAtPrice {
              amount
            }
          }
        }
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
