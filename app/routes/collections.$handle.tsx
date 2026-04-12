/**
 * @fileoverview Collection Page Route (/collections/:handle)
 *
 * @description
 * Displays products from a specific Shopify collection with filtering,
 * sorting, and infinite scroll pagination. Features include:
 * - Product grid with configurable layout (grid/list)
 * - Sort options (price, title, date)
 * - Infinite scroll pagination
 * - Sale badge with discounted product count
 * - Responsive column configuration
 *
 * @url-pattern /collections/:handle
 * The handle is the collection's URL-friendly identifier from Shopify.
 *
 * @architecture
 * Data Loading:
 * - Critical: Collection data with first page of products
 * - Deferred: Additional data (currently minimal)
 *
 * Sorting:
 * - Sort option stored in URL query params (?sort=price-asc)
 * - Mapped to Shopify's ProductCollectionSortKeys
 *
 * Pagination:
 * - Uses cursor-based pagination from Storefront API
 * - InfiniteScrollSection handles fetcher requests
 *
 * @seo
 * - Dynamic meta from collection SEO fields
 * - JSON-LD CollectionPage schema
 * - Canonical URL for each collection
 *
 * @related
 * - CollectionPageLayout.tsx - Layout and filter controls
 * - InfiniteScrollSection.tsx - Pagination handling
 * - ProductItem.tsx - Product card display
 */

import {redirect, useLoaderData, useRouteError, isRouteErrorResponse} from "react-router";
import type {Route} from "./+types/collections.$handle";
import {Analytics, getSeoMeta, getPaginationVariables} from "@shopify/hydrogen";
import {InfiniteScrollSection} from "~/components/InfiniteScrollSection";
import {redirectIfHandleIsLocalized} from "~/lib/redirect";
import {ProductItem} from "~/components/ProductItem";
import {
    CollectionPageLayout,
    useGridColumns,
    useSortOption,
    useLayoutMode,
    mapSortToCollectionSortKey,
    getGridClassName
} from "~/components/CollectionPageLayout";
import {AnimatedSection} from "~/components/AnimatedSection";
import {countDiscountedProducts, type LightweightProduct} from "~/lib/discounts";
import type {ProductItemFragment} from "storefrontapi.generated";
import type {ProductCollectionSortKeys} from "@shopify/hydrogen/storefront-api-types";
import {
    generateCollectionSchema,
    truncateDescription,
    buildCanonicalUrl,
    getBrandNameFromMatches,
    getSiteUrlFromMatches
} from "~/lib/seo";
import {ProductCardSkeleton, ProductListSkeleton} from "~/components/skeletons";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";
import {trackErrorBoundary} from "~/hooks/usePwaAnalytics";
import {sortWithPinnedFirst} from "~/lib/product-tags";

// =============================================================================
// META FUNCTION
// =============================================================================

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    // Only show collection SEO for full page loads (not fetcher requests)
    if (!data || !("collection" in data) || !data.collection) {
        return [{title: `Collection | ${brandName}`}];
    }

    const collection = data.collection;
    const title = collection.seo?.title || `${collection.title} Collection`;
    const description = collection.seo?.description || truncateDescription(collection.description);
    const products = collection.products?.nodes || [];

    return (
        getSeoMeta({
            title,
            titleTemplate: `%s | ${brandName}`,
            description,
            url: buildCanonicalUrl(`/collections/${collection.handle}`, siteUrl),
            media: collection.image?.url
                ? {
                      url: collection.image.url,
                      width: collection.image.width,
                      height: collection.image.height,
                      altText: collection.image.altText || collection.title,
                      type: "image" as const
                  }
                : undefined,
            jsonLd: generateCollectionSchema(collection, products, siteUrl) as any
        }) ?? []
    );
};

export async function loader(args: Route.LoaderArgs) {
    // Start fetching non-critical data without blocking time to first byte
    const deferredData = loadDeferredData(args);

    // Await the critical data required to render initial state of the page
    const criticalData = await loadCriticalData(args);

    return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
    const {handle} = params;
    const {dataAdapter} = context;
    const url = new URL(request.url);

    // Parse sorting params
    const sortParam = url.searchParams.get("sort") || "newest";
    const {sortKey, reverse} = mapSortToCollectionSortKey(sortParam);

    if (!handle) {
        throw redirect("/collections");
    }

    // Use official Hydrogen pagination pattern (24 items per page)
    const paginationVariables = getPaginationVariables(request, {pageBy: 24});

    const [{collection}, sidebarData, collectionCountData] = await Promise.all([
        // Collection products - availability and prices (cached: short for availability)
        dataAdapter.query(COLLECTION_QUERY, {
            variables: {
                handle,
                ...paginationVariables,
                sortKey: sortKey as ProductCollectionSortKeys,
                reverse
            },
            cache: dataAdapter.CacheShort()
        }),
        // Sidebar collections with product counts (cached: catalog metadata)
        dataAdapter.query(SIDEBAR_COLLECTIONS_QUERY, {
            cache: dataAdapter.CacheLong()
        }),
        // Lightweight count query for accurate collection product count (cached: catalog metadata)
        dataAdapter.query(COLLECTION_COUNT_QUERY, {
            variables: {handle},
            cache: dataAdapter.CacheLong()
        })
    ]);

    if (!collection) {
        throw new Response(`Collection ${handle} not found`, {
            status: 404
        });
    }

    // The API handle might be localized, so redirect to the localized handle
    redirectIfHandleIsLocalized(request, {handle, data: collection});

    // Process collections to get individual product counts
    // Filter out collections with no available products (API already filters unavailable)
    const {collections, allProducts} = sidebarData!;
    const collectionsWithCounts = collections.nodes
        .map((col: any) => ({
            handle: col.handle,
            title: col.title,
            productsCount: col.products.nodes.length
        }))
        .filter((col: any) => col.productsCount > 0);

    // Count all available products directly (includes products not in any collection)
    // API-level filter (query: "available_for_sale:true") ensures only available products are returned
    const totalProductCount = allProducts.nodes.length;

    // Count discounted products for sidebar
    const discountCount = countDiscountedProducts(allProducts.nodes as LightweightProduct[]);

    // Accurate collection product count from lightweight count query (up to 250)
    // The main COLLECTION_QUERY paginates at 24, so its .nodes.length would be inaccurate
    const collectionProductCount = collectionCountData?.collection?.products?.nodes?.length ?? 0;

    return {
        collection,
        collectionsWithCounts,
        totalProductCount,
        collectionProductCount,
        discountCount
    };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
    return {};
}

export default function Collection() {
    const {collection, collectionsWithCounts, totalProductCount, collectionProductCount, discountCount} =
        useLoaderData<typeof loader>();
    const [gridColumns, setGridColumns] = useGridColumns();
    const [sortOption, setSortOption] = useSortOption("newest");
    const [layoutMode, setLayoutMode] = useLayoutMode();

    // Dynamic class based on layout mode and grid columns
    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    // Client-side sorting: Pinned products always appear first
    // Shopify's server-side sorting can't prioritize by custom tags
    // This sorts pinned products to the top while preserving the user's secondary sort
    const sortProductsWithPinned = (products: ProductItemFragment[]) => {
        // Create comparator based on current sort option
        // This ensures BOTH pinned and non-pinned products respect the user's chosen sort
        let comparator: ((a: ProductItemFragment, b: ProductItemFragment) => number) | undefined;

        switch (sortOption) {
            case "price-asc":
                comparator = (a, b) =>
                    parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount);
                break;
            case "price-desc":
                comparator = (a, b) =>
                    parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount);
                break;
            case "title-asc":
                comparator = (a, b) => a.title.localeCompare(b.title);
                break;
            case "title-desc":
                comparator = (a, b) => b.title.localeCompare(a.title);
                break;
            // For "newest" and "best-selling", rely on Shopify's pre-sorting (no comparator needed)
            // Shopify's CREATED / BEST_SELLING sortKeys provide the correct order
        }

        return sortWithPinnedFirst(products, comparator);
    };

    return (
        <CollectionPageLayout
            title={collection.title}
            description={collection.description}
            collections={collectionsWithCounts ?? []}
            activeHandle={collection.handle}
            totalProductCount={totalProductCount ?? 0}
            collectionProductCount={collectionProductCount}
            discountCount={discountCount ?? 0}
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
            sortOption={sortOption}
            onSortChange={setSortOption}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
        >
            <AnimatedSection animation="slide-up" threshold={0.12}>
                <InfiniteScrollSection<ProductItemFragment>
                    key={`${sortOption}-${layoutMode}-${gridColumns}`}
                    connection={collection.products}
                    resourcesClassName={resourcesClassName}
                    showSkeletons
                    skeletonCount={8}
                    sortNodes={sortProductsWithPinned}
                    renderSkeleton={
                        layoutMode === "list"
                            ? () => <ProductListSkeleton animate={false} />
                            : () => <ProductCardSkeleton animate={false} />
                    }
                >
                    {({node: product, index}) => (
                        <ProductItem
                            key={product.id}
                            product={product}
                            loading={index < 12 ? "eager" : undefined}
                            variant={layoutMode === "list" ? "list" : "card"}
                            index={index}
                            gridColumns={gridColumns}
                        />
                    )}
                </InfiniteScrollSection>
            </AnimatedSection>
            <Analytics.CollectionView
                data={{
                    collection: {
                        id: collection.id,
                        handle: collection.handle
                    }
                }}
            />
        </CollectionPageLayout>
    );
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

/**
 * Collection-specific error boundary.
 * Shows contextual "Collection Not Found" for 404s with offline detection.
 */
export function ErrorBoundary() {
    const error = useRouteError();
    let statusCode = 500;
    let errorMessage: string | undefined;

    if (isRouteErrorResponse(error)) {
        statusCode = error.status;
        errorMessage = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    // Track error via analytics (SSR-safe, runs on client only)
    const errorType = isRouteErrorResponse(error) ? "route_error" : "js_error";
    if (typeof window !== "undefined") {
        setTimeout(() => trackErrorBoundary(statusCode, errorType, "collections"), 0);
    }

    // Contextual 404 title for collections
    const title = statusCode === 404 ? "Collection Not Found" : undefined;

    return <OfflineAwareErrorPage statusCode={statusCode} title={title} message={errorMessage} />;
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    availableForSale
    tags
    featuredImage {
      id
      altText
      url
      width
      height
    }
    images(first: 10) {
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
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyProductItem
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
          ...MoneyProductItem
        }
        compareAtPrice {
          ...MoneyProductItem
        }
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        title
        description
      }
      image {
        url
        altText
        width
        height
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        sortKey: $sortKey
        reverse: $reverse
        filters: $filters
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
` as const;

// Query to fetch all collections with product counts for sidebar
// Also fetches all products directly for accurate "All" count (includes products not in any collection)
const SIDEBAR_COLLECTIONS_QUERY = `#graphql
  query SidebarCollectionsHandle(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 50, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        products(first: 250) {
          nodes {
            id
          }
        }
      }
    }
    allProducts: products(first: 250, query: "available_for_sale:true") {
      nodes {
        id
        availableForSale
        variants(first: 10) {
          nodes {
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
        }
      }
    }
  }
` as const;

// Lightweight query to get accurate product count for a collection
// The main COLLECTION_QUERY paginates at 24, so .nodes.length caps at page size
const COLLECTION_COUNT_QUERY = `#graphql
  query CollectionCount(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 250) {
        nodes { id }
        pageInfo { hasNextPage }
      }
    }
  }
` as const;
