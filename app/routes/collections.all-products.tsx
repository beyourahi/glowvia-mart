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
import {useLoaderData} from "react-router";
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
import type {CollectionItemFragment} from "storefrontapi.generated";
import type {ProductSortKeys} from "@shopify/hydrogen/storefront-api-types";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const productCount = data && "totalProductCount" in data ? (data.totalProductCount ?? 0) : 0;

    return (
        getSeoMeta({
            title: "All Products",
            titleTemplate: `%s | ${brandName}`,
            description:
                productCount > 0
                    ? `Browse our complete collection of ${productCount} handcrafted products.`
                    : "Browse our complete collection of handcrafted products.",
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

    const [{products}, sidebarData] = await Promise.all([
        // All products catalog (cached: short for availability)
        dataAdapter.query(CATALOG_QUERY, {
            variables: {
                ...paginationVariables,
                sortKey: sortKey as ProductSortKeys,
                reverse
            },
            cache: dataAdapter.CacheShort()
        }),
        // Sidebar collections with product counts (cached: catalog metadata)
        dataAdapter.query(SIDEBAR_COLLECTIONS_QUERY, {
            cache: dataAdapter.CacheLong()
        })
    ]);

    // Process collections to get individual product counts
    // Filter out collections with no available products (API already filters unavailable)
    const {collections, allProducts} = sidebarData!;
    const collectionsWithCounts = collections.nodes
        .map((collection: any) => ({
            handle: collection.handle,
            title: collection.title,
            productsCount: collection.products.nodes.length
        }))
        .filter((collection: any) => collection.productsCount > 0);

    // Count all available products directly (includes products not in any collection)
    // API-level filter (query: "available_for_sale:true") ensures only available products are returned
    const totalProductCount = allProducts.nodes.length;

    // Count discounted products for sidebar
    const discountCount = countDiscountedProducts(allProducts.nodes as LightweightProduct[]);

    return {products, collectionsWithCounts, totalProductCount, discountCount};
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
    const {products, collectionsWithCounts, totalProductCount, discountCount} = useLoaderData<typeof loader>();
    const [gridColumns, setGridColumns] = useGridColumns();
    const [sortOption, setSortOption] = useSortOption("newest");
    const [layoutMode, setLayoutMode] = useLayoutMode();

    // Dynamic class based on layout mode and grid columns
    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    return (
        <CollectionPageLayout
            title="All Products"
            description="Browse our complete collection, from timeless essentials to new arrivals."
            collections={collectionsWithCounts ?? []}
            activeHandle="all-products"
            totalProductCount={totalProductCount ?? 0}
            discountCount={discountCount ?? 0}
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
            sortOption={sortOption}
            onSortChange={setSortOption}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
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
      query: "available_for_sale:true"
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

/**
 * Fetches collections for sidebar with accurate product counts.
 *
 * Also queries all products directly because:
 * - Some products may not belong to any collection
 * - "All" count should include orphan products
 * - Discount count needs variant pricing data
 */
const SIDEBAR_COLLECTIONS_QUERY = `#graphql
  query SidebarCollectionsAll(
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

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
