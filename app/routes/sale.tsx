/**
 * @fileoverview Sale / Discounted Products Page
 *
 * @description
 * Displays all products currently on sale (with compare-at pricing).
 * Automatically filters to only discounted items and sorts by
 * highest discount percentage. Uses the shared collection layout.
 *
 * @route GET /sale
 *
 * @features
 * - Automatic discount detection (compare-at vs current price)
 * - Sorted by highest discount percentage
 * - Shows max discount in page title/meta
 * - Infinite scroll pagination
 * - Grid/list layout toggle
 * - Collection sidebar navigation
 *
 * @discount-detection
 * Products are considered "on sale" if:
 * 1. Product has compareAtPriceRange
 * 2. Any variant has compareAtPrice > price
 * 3. Discount percentage is calculated per variant
 *
 * @sorting
 * Unlike other collection pages, sale page:
 * - Always sorts by discount % (highest first)
 * - Sort controls are hidden
 * - No user-configurable sorting
 *
 * @empty-state
 * Shows friendly message when no products are on sale,
 * encouraging users to check back later.
 *
 * @related
 * - lib/discounts.ts - Discount calculation utilities
 * - CollectionPageLayout.tsx - Shared layout component
 * - DiscountBadge.tsx - Visual discount indicator
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/Product
 */

import type {Route} from "./+types/sale";
import {useLoaderData, Await} from "react-router";
import {Suspense} from "react";
import {getSeoMeta, getPaginationVariables} from "@shopify/hydrogen";
import {InfiniteScrollSection} from "~/components/InfiniteScrollSection";
import {ProductItem} from "~/components/ProductItem";
import {CollectionPageLayout, useGridColumns, useLayoutMode, getGridClassName} from "~/components/CollectionPageLayout";
import {AnimatedSection} from "~/components/AnimatedSection";
import {CollectionSidebar, type CollectionWithCount} from "~/components/CollectionSidebar";
import {filterAndSortDiscountedProducts, countDiscountedProducts, type DiscountedProduct, type RawDiscountProduct, type LightweightProduct} from "~/lib/discounts";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {withTimeoutAndFallback, TIMEOUT_DEFAULTS} from "~/lib/promise-utils";
import {SIDEBAR_COLLECTIONS_QUERY} from "~/lib/fragments";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const maxDiscount = data?.maxDiscount ?? 0;

    const title = maxDiscount > 0 ? `SALE - Up to ${maxDiscount}% Off` : `SALE`;
    const description =
        maxDiscount > 0
            ? `Discover discounted items with savings up to ${maxDiscount}% off.`
            : "Check back soon for sale items and amazing deals.";

    return (
        getSeoMeta({
            title,
            titleTemplate: `%s | ${brandName}`,
            description,
            url: buildCanonicalUrl("/sale", siteUrl)
        }) ?? []
    );
};

function loadDeferredData({context}: Route.LoaderArgs) {
    const {dataAdapter} = context;

    // Sidebar collections - deferred so it doesn't block sale page above-fold rendering
    const sidebarData = withTimeoutAndFallback(
        dataAdapter
            .query(SIDEBAR_COLLECTIONS_QUERY, {cache: dataAdapter.CacheLong()})
            .catch((error: unknown) => {
                console.error("Failed to load sidebar collections:", error);
                return null;
            }),
        null,
        TIMEOUT_DEFAULTS.API
    );

    return {sidebarData};
}

export async function loader(args: Route.LoaderArgs) {
    const deferredData = loadDeferredData(args);
    const criticalData = await loadCriticalData(args);
    return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
    const {dataAdapter} = context;

    // Use official Hydrogen pagination pattern (24 items per page)
    const paginationVariables = getPaginationVariables(request, {pageBy: 24});

    const [{products}, {products: allDiscountedProducts}] = await Promise.all([
        // Discounted products with prices (cached: short for availability)
        dataAdapter.query(DISCOUNTS_QUERY, {
            variables: paginationVariables,
            cache: dataAdapter.CacheShort()
        }),
        // Fetch first 250 products to get accurate total count (cached: short)
        dataAdapter.query(DISCOUNTS_QUERY, {
            variables: {first: 250},
            cache: dataAdapter.CacheShort()
        })
    ]);

    // Transform and filter paginated products for display (sorted by highest discount)
    const discountedProducts = filterAndSortDiscountedProducts(products.nodes as RawDiscountProduct[]);

    // Transform and filter ALL products to get accurate total count
    const allDiscounted = filterAndSortDiscountedProducts(allDiscountedProducts.nodes as RawDiscountProduct[]);
    const totalCount = allDiscounted.length;

    // Calculate max discount from ALL discounted products (not just paginated)
    const maxDiscount = totalCount > 0 ? Math.max(...allDiscounted.map(p => p.maxDiscountPercentage)) : 0;

    return {
        products: discountedProducts,
        pageInfo: products.pageInfo,
        totalCount,
        maxDiscount
    };
}

const SIDEBAR_SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"] as const;

const SidebarSkeleton = () => (
    <div className="space-y-1">
        {SIDEBAR_SKELETON_KEYS.map(key => (
            <div key={key} className="h-8 rounded-md bg-foreground/5 animate-pulse" />
        ))}
    </div>
);

export default function SalePage() {
    const {products, pageInfo, totalCount, maxDiscount, sidebarData} = useLoaderData<typeof loader>();
    const [gridColumns, setGridColumns] = useGridColumns("sale-grid-columns");
    const [layoutMode, setLayoutMode] = useLayoutMode("sale-layout-mode");

    // Dynamic class based on layout mode and grid columns
    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    // No-op sort handler - sale page always sorts by highest discount
    const noOpSort = () => {};

    // Create connection for InfiniteScrollSection
    const connection = {
        nodes: products,
        pageInfo
    };

    return (
        <CollectionPageLayout
            title="SALE"
            description="Limited-time offers on select items. Shop now while supplies last."
            activeHandle="sale"
            collectionProductCount={totalCount}
            discountCount={totalCount}
            maxDiscount={maxDiscount}
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
            sortOption="newest"
            onSortChange={noOpSort}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
            showSortOptions={false}
            sidebarSlot={
                <Suspense fallback={<SidebarSkeleton />}>
                    <Await resolve={sidebarData}>
                        {(sidebar: any) => {
                            if (!sidebar) return null;
                            const {collections, allProducts} = sidebar;
                            const collectionsWithCounts: CollectionWithCount[] = collections.nodes
                                .map((col: any) => ({
                                    handle: col.handle,
                                    title: col.title,
                                    productsCount: col.products.nodes.length
                                }))
                                .filter((col: any) => col.productsCount > 0);
                            const totalProductCount = allProducts.nodes.length;
                            const discountCount = countDiscountedProducts(allProducts.nodes as LightweightProduct[]);
                            return (
                                <CollectionSidebar
                                    collections={collectionsWithCounts}
                                    activeHandle="sale"
                                    totalProductCount={totalProductCount}
                                    discountCount={discountCount}
                                />
                            );
                        }}
                    </Await>
                </Suspense>
            }
        >
            <AnimatedSection animation="slide-up" threshold={0.12}>
                {totalCount > 0 ? (
                    <InfiniteScrollSection<DiscountedProduct>
                        key={`sale-${layoutMode}-${gridColumns}`}
                        connection={connection}
                        resourcesClassName={resourcesClassName}
                    >
                        {({node: product, index}) => (
                            <ProductItem
                                key={product.id}
                                product={product as any}
                                loading={index < 12 ? "eager" : undefined}
                                variant={layoutMode === "list" ? "list" : "card"}
                                index={index}
                                gridColumns={gridColumns}
                            />
                        )}
                    </InfiniteScrollSection>
                ) : (
                    <EmptyState />
                )}
            </AnimatedSection>
        </CollectionPageLayout>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-muted-foreground"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.159 3.66A2.25 2.25 0 0 0 9.568 3Z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
            </div>
            <h2 className="text-xl font-medium text-primary mb-2">No Sale Items Available</h2>
            <p className="text-muted-foreground max-w-md">Check back soon for amazing deals on our products.</p>
        </div>
    );
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fragment for variant pricing data.
 *
 * Includes both price and compareAtPrice to calculate discount.
 * Uses MoneyV2 format for proper currency handling.
 */
const DISCOUNT_VARIANT_FRAGMENT = `#graphql
  fragment DiscountVariant on ProductVariant {
    id
    availableForSale
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
  }
` as const;

/**
 * Fragment for product with variant pricing.
 *
 * Fetches up to 250 variants to ensure accurate discount
 * detection across all product options. Includes both
 * priceRange and compareAtPriceRange for quick checks.
 */
const DISCOUNT_PRODUCT_FRAGMENT = `#graphql
  fragment DiscountProduct on Product {
    id
    handle
    title
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
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
    variants(first: 250) {
      nodes {
        ...DiscountVariant
      }
    }
  }
  ${DISCOUNT_VARIANT_FRAGMENT}
` as const;

/**
 * Main query for sale page products.
 *
 * Fetches all available products for client-side discount filtering.
 * Products are filtered and sorted in loadCriticalData() after fetch.
 */
const DISCOUNTS_QUERY = `#graphql
  query DiscountsPage(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
    ) {
      nodes {
        ...DiscountProduct
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${DISCOUNT_PRODUCT_FRAGMENT}
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
