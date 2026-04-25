/**
 * @fileoverview All Products Page
 *
 * @description
 * Displays all products in the store regardless of collection.
 * Uses the shared collection layout with sidebar navigation,
 * sorting options, and infinite scroll.
 *
 * @route GET /collections/all-products
 *
 * @features
 * - All available products
 * - Sorting (newest, price, name A-Z/Z-A)
 * - Grid columns toggle (2-4)
 * - Grid/list layout toggle
 * - Infinite scroll pagination
 * - Collection sidebar navigation
 * - Discount count indicator
 *
 * @sidebar-navigation
 * Shows all collections with product counts.
 * "All Products" is highlighted as active.
 * Links to /sale for discounted products.
 *
 * @sorting-options
 * - Featured (default Shopify order)
 * - Price: Low to High
 * - Price: High to Low
 * - Date: Old to New
 * - Date: New to Old
 * - Alphabetically: A-Z
 * - Alphabetically: Z-A
 *
 * @data-loading
 * Uses critical/deferred pattern:
 * - Critical: Products, sidebar collections, counts
 * - Deferred: None (could add recommendations)
 *
 * @related
 * - collections.$handle.tsx - Single collection
 * - sale.tsx - Discounted products only
 * - CollectionPageLayout.tsx - Shared layout
 *
 * @see https://shopify.dev/docs/api/storefront/latest/queries/products
 */

import type {Route} from "./+types/collections.all-products";
import {useLoaderData, Await} from "react-router";
import {Suspense} from "react";
import {getSeoMeta, getPaginationVariables} from "@shopify/hydrogen";
import {InfiniteScrollSection} from "~/components/InfiniteScrollSection";
import {ProductItem} from "~/components/ProductItem";
import {
    CollectionPageLayout,
    useGridColumns,
    useSortOption,
    useLayoutMode,
    mapSortToProductSortKey,
    getGridClassName
} from "~/components/CollectionPageLayout";
import {countDiscountedProducts, type LightweightProduct} from "~/lib/discounts";
import {withTimeoutAndFallback, TIMEOUT_DEFAULTS} from "~/lib/promise-utils";
import {SIDEBAR_COLLECTIONS_QUERY} from "~/lib/fragments";
import {CollectionSidebar, type CollectionWithCount} from "~/components/CollectionSidebar";
import type {CollectionItemFragment} from "storefrontapi.generated";
import type {ProductSortKeys} from "@shopify/hydrogen/storefront-api-types";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);

    return (
        getSeoMeta({
            title: "All Products",
            titleTemplate: `%s | ${brandName}`,
            description: "Browse our complete collection of handcrafted products.",
            url: buildCanonicalUrl("/collections/all-products", siteUrl)
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
async function loadCriticalData({context, request}: Route.LoaderArgs) {
    const {dataAdapter} = context;
    const url = new URL(request.url);

    // Parse sorting params
    const sortParam = url.searchParams.get("sort") || "newest";
    const {sortKey, reverse} = mapSortToProductSortKey(sortParam);

    // Use official Hydrogen pagination pattern (24 items per page)
    const paginationVariables = getPaginationVariables(request, {pageBy: 24});

    const {products} = await dataAdapter.query(CATALOG_QUERY, {
        variables: {
            ...paginationVariables,
            sortKey: sortKey as ProductSortKeys,
            reverse
        },
        cache: dataAdapter.CacheShort()
    });

    return {products};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
    const {dataAdapter} = context;

    // Sidebar collections - deferred so it doesn't block all-products above-fold rendering
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

const SIDEBAR_SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"] as const;

const SidebarSkeleton = () => (
    <div className="space-y-1">
        {SIDEBAR_SKELETON_KEYS.map(key => (
            <div key={key} className="h-8 rounded-md bg-foreground/5 animate-pulse" />
        ))}
    </div>
);

export default function Collection() {
    const {products, sidebarData} = useLoaderData<typeof loader>();
    const [gridColumns, setGridColumns] = useGridColumns();
    const [sortOption, setSortOption] = useSortOption("newest");
    const [layoutMode, setLayoutMode] = useLayoutMode();

    // Dynamic class based on layout mode and grid columns
    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    return (
        <CollectionPageLayout
            title="All Products"
            description="Browse our complete collection, from timeless essentials to new arrivals."
            activeHandle="all-products"
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
            sortOption={sortOption}
            onSortChange={setSortOption}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
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
                                    activeHandle="all-products"
                                    totalProductCount={totalProductCount}
                                    discountCount={discountCount}
                                />
                            );
                        }}
                    </Await>
                </Suspense>
            }
        >
            <InfiniteScrollSection<CollectionItemFragment>
                key={`${sortOption}-${layoutMode}-${gridColumns}`}
                connection={products}
                resourcesClassName={resourcesClassName}
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
        </CollectionPageLayout>
    );
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fragment for product card display.
 *
 * Includes comprehensive data for ProductItem component:
 * - Images (featured + first 10 for gallery)
 * - Pricing (range + compare-at for sales)
 * - Variants (for option display and cart)
 * - Tags (for badges like "new")
 */
const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
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
    media(first: 5) {
      nodes {
        __typename
        ... on MediaImage {
          id
          alt
          image {
            id
            url
            altText
            width
            height
          }
        }
        ... on Video {
          id
          alt
          sources {
            url
            mimeType
            width
            height
          }
          previewImage {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyCollectionItem
      }
      maxVariantPrice {
        ...MoneyCollectionItem
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyCollectionItem
      }
    }
    variants(first: 5) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          ...MoneyCollectionItem
        }
        compareAtPrice {
          ...MoneyCollectionItem
        }
      }
    }
  }
` as const;

/**
 * Main catalog query with sorting support.
 *
 * @param sortKey - Product sort key (TITLE, PRICE, CREATED_AT, etc.)
 * @param reverse - Reverse sort order
 *
 * @see https://shopify.dev/docs/api/storefront/latest/queries/products
 */
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
