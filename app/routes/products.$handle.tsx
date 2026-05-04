/**
 * @fileoverview Product Detail Page Route (/products/:handle)
 *
 * @description
 * The main product page for viewing and purchasing individual products.
 * Features a rich product experience with:
 * - Image gallery with zoom
 * - Variant selection (size, color, etc.)
 * - Add to cart functionality with subscription options
 * - Discount badges
 * - Share and wishlist actions
 * - Related products recommendations
 * - Collection sidebar navigation
 *
 * @url-pattern /products/:handle
 * The handle is the product's URL-friendly identifier from Shopify.
 *
 * @architecture
 * Data Loading:
 * - Critical: Product data with selected variant, sidebar collections
 * - Deferred: Related products recommendations
 *
 * Variant Selection:
 * - Options are reflected in URL query params (?Color=Red&Size=L)
 * - Uses useOptimisticVariant for instant UI updates
 * - useSelectedOptionInUrlParam syncs URL with selection
 *
 * @seo
 * - Dynamic meta from product SEO fields or fallbacks
 * - JSON-LD Product schema for rich snippets
 * - Canonical URL prevents duplicate content
 *
 * @tracking
 * - Product view tracked via Hydrogen Analytics
 * - Added to recently viewed products
 *
 * @related
 * - ProductForm.tsx - Variant selection and add to cart
 * - ProductImageGallery.tsx - Image display and zoom
 * - RelatedProducts.tsx - Product recommendations
 * - cart.tsx - Cart actions handler
 */

import {useEffect, Suspense} from "react";
import {useLoaderData, useRouteError, isRouteErrorResponse, Await} from "react-router";
import type {Route} from "./+types/products.$handle";
import {
    getSelectedProductOptions,
    Analytics,
    useOptimisticVariant,
    getProductOptions,
    getAdjacentAndFirstAvailableVariants,
    useSelectedOptionInUrlParam,
    getSeoMeta
} from "@shopify/hydrogen";
import {useScrolled} from "~/lib/useScrolled";
import {cn} from "~/lib/utils";
import {ProductImageGallery} from "~/components/ProductImageGallery";
import {ProductForm} from "~/components/ProductForm";
import {StickyMobileGetNow} from "~/components/StickyMobileGetNow";
import {ProductShareButton} from "~/components/ProductShareButton";
import {WishlistButton} from "~/components/WishlistButton";
import {ProductDiscountBadge} from "~/components/ProductDiscountBadge";
import {ProductTitle} from "~/components/ProductTitle";
import {ProductDescription} from "~/components/ProductDescription";
import {redirectIfHandleIsLocalized} from "~/lib/redirect";
import {useRecentlyViewed} from "~/lib/recently-viewed";
import {CollectionSidebar, type CollectionWithCount} from "~/components/CollectionSidebar";
import {RelatedProducts} from "~/components/RelatedProducts";
import {
    getBrandNameFromMatches,
    generateProductSchema,
    generateBreadcrumbListSchema,
    generateBrandSchema,
    truncateDescription,
    stripHtml,
    buildCanonicalUrl,
    getSiteUrlFromMatches,
    getRequiredSocialMeta
} from "~/lib/seo";
import {deriveProductBreadcrumbs} from "~/lib/seo-breadcrumbs";
import {getCatalogExtensionMeta} from "~/lib/agentic/structured-data";
import {normalizeProductAttributes} from "~/lib/agentic/attribute-normalizer";
import {Badge} from "~/components/ui/badge";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";
import {trackErrorBoundary} from "~/hooks/usePwaAnalytics";
import {hasSpecialTag, getSpecialTags} from "~/lib/product-tags";
import {AgentProductBrief} from "~/components/product/AgentProductBrief";
import {useAgentSurface} from "~/lib/agent-surface-context";
import {ProductBadgeStack} from "~/components/product/ProductBadge";
import {ProductTagList} from "~/components/product/ProductTagList";
import {countDiscountedProducts, type LightweightProduct} from "~/lib/discounts";
import {withTimeoutAndFallback, TIMEOUT_DEFAULTS} from "~/lib/promise-utils";
import {SIDEBAR_COLLECTIONS_QUERY} from "~/lib/fragments";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {parseProductTitle} from "~/lib/product";
import {ProductReviews, type ReviewNode} from "~/components/ProductReviews";
import {extractImagesFromMedia} from "~/lib/media-utils";
import {CatalogExtensionDisplay} from "~/components/product/CatalogExtensionDisplay";

// =============================================================================
// META FUNCTION
// =============================================================================

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const product = data?.product;
    if (!product) return [{title: `Product Not Found | ${brandName}`}];

    const variant = product.selectedOrFirstAvailableVariant;
    const {primary, secondary} = parseProductTitle(product.title);
    const title = product.seo?.title || (secondary ? `${primary} + ${secondary}` : primary);
    const description = truncateDescription(product.seo?.description || stripHtml(product.description));
    const image = variant?.image || extractImagesFromMedia(product.media?.nodes)?.[0];

    const rootMatch = matches.find((m): m is (typeof matches)[number] & {id: "root"} => m?.id === "root");
    const siteSettings = (rootMatch?.data as any)?.siteContent?.siteSettings;

    // SCE fields for 5th arg
    const extensionFields = {
        isGiftCard: product.isGiftCard,
        collections: product.collections?.nodes?.map((c: any) => ({handle: c.handle, title: c.title})),
        requiresShipping: variant?.requiresShipping,
        sellingPlans: variant?.sellingPlanAllocations?.nodes?.map((a: any) => ({name: a.sellingPlan?.name ?? "Subscription", recurringDeliveries: a.sellingPlan?.recurringDeliveries ?? false}))
    };

    // Normalized attributes for 6th arg
    const normalizedAttributes = normalizeProductAttributes(
        variant?.selectedOptions ?? [],
        product.metafields?.filter(Boolean) ?? undefined
    );

    const productSchema = generateProductSchema(product, variant, null, siteUrl, extensionFields, normalizedAttributes);
    const breadcrumbs = deriveProductBreadcrumbs(product);
    const breadcrumbSchema = generateBreadcrumbListSchema(breadcrumbs, siteUrl);
    const brandSchema = generateBrandSchema(siteSettings, product.vendor);
    const sceMeta = getCatalogExtensionMeta({
        isGiftCard: product.isGiftCard,
        requiresShipping: variant?.requiresShipping,
        sellingPlans: variant?.sellingPlanAllocations?.nodes?.map((a: any) => ({name: a.sellingPlan?.name ?? "Subscription"})),
        collections: product.collections?.nodes?.map((c: any) => ({handle: c.handle, title: c.title})),
        quantityAvailable: variant?.quantityAvailable,
        currentlyNotInStock: variant?.currentlyNotInStock
    });

    const seoMeta =
        getSeoMeta({
            title,
            description,
            url: buildCanonicalUrl(`/products/${product.handle}`, siteUrl),
            media: image?.url
                ? {
                      url: image.url,
                      width: image.width,
                      height: image.height,
                      altText: image.altText || product.title,
                      type: "image" as const
                  }
                : undefined,
            jsonLd: productSchema as any
        }) ?? [];

    const preloadHref = data?.product?.images?.nodes?.[0]?.url;
    const withPreload = preloadHref
        ? [...seoMeta, {tagName: "link" as const, rel: "preload", as: "image", href: preloadHref}]
        : seoMeta;

    return [
        ...withPreload,
        {"script:ld+json": breadcrumbSchema as any},
        {"script:ld+json": brandSchema as any},
        ...sceMeta,
        ...getRequiredSocialMeta("product", brandName, image?.url ?? undefined)
    ];
};

export async function loader(args: Route.LoaderArgs) {
    // Await the critical data required to render initial state of the page
    const criticalData = await loadCriticalData(args);

    // Start fetching non-critical data (needs product.id from critical data)
    const deferredData = loadDeferredData(args, criticalData.product.id);

    return {...criticalData, ...deferredData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
    const {handle} = params;
    const {dataAdapter} = context;

    if (!handle) {
        throw new Error("Expected product handle to be defined");
    }

    const {product} = await dataAdapter.query(PRODUCT_QUERY, {
        variables: {handle, selectedOptions: getSelectedProductOptions(request)},
        cache: dataAdapter.CacheShort()
    });

    if (!product?.id) {
        throw new Response(null, {status: 404});
    }

    // The API handle might be localized, so redirect to the localized handle
    redirectIfHandleIsLocalized(request, {handle, data: product});

    // Get the first collection handle this product belongs to (for sidebar active state)
    // Derived from product.collections — must stay in critical data, not in deferred sidebar
    const productCollectionHandles = product.collections?.nodes?.map((c: any) => c.handle) ?? [];
    const activeCollectionHandle = productCollectionHandles[0] || "all-products";

    // Parse selling plan from URL and find the selected selling plan
    const url = new URL(request.url);
    const selectedSellingPlanId = url.searchParams.get("selling_plan");
    let selectedSellingPlan = null;

    if (selectedSellingPlanId && product.sellingPlanGroups?.nodes) {
        for (const group of product.sellingPlanGroups.nodes) {
            const plan = group.sellingPlans.nodes.find((p: any) => p.id === selectedSellingPlanId);
            if (plan) {
                selectedSellingPlan = plan;
                break;
            }
        }
    }

    return {
        product,
        selectedSellingPlan,
        activeCollectionHandle
    };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs, productId: string) {
    const {dataAdapter} = context;

    // Product recommendations - deferred (real-time, no cache)
    const recommendations = dataAdapter
        .query(RECOMMENDATIONS_QUERY, {
            variables: {productId},
            cache: dataAdapter.CacheShort()
        })
        .then((data: any) => {
            // Return all recommendations including OOS so shoppers can browse and wishlist them
            return data.productRecommendations ?? [];
        })
        .catch(() => null);

    const reviews = dataAdapter
        .query(PRODUCT_REVIEWS_QUERY, {
            variables: {id: productId},
            cache: dataAdapter.CacheShort()
        })
        .then((data: any) => (data.product?.reviews?.references?.nodes ?? []) as ReviewNode[])
        .catch(() => [] as ReviewNode[]);

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

    return {
        recommendations,
        reviews,
        sidebarData
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

export default function Product() {
    const {
        product,
        recommendations,
        reviews,
        sidebarData,
        activeCollectionHandle,
        selectedSellingPlan
    } = useLoaderData<typeof loader>();
    const {addProduct} = useRecentlyViewed();

    // Track scroll state for sticky sidebar positioning
    // Header adds pt-3 (12px) when scrolled, sidebar needs to match this offset
    const isScrolled = useScrolled(0);

    // Optimistically selects a variant with given available variant information
    const selectedVariant = useOptimisticVariant(
        product.selectedOrFirstAvailableVariant,
        getAdjacentAndFirstAvailableVariants(product)
    );

    // Sets the search param to the selected variant without navigation
    // only when no search params are set in the url
    useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

    // Get the product options array
    const productOptions = getProductOptions({
        ...product,
        selectedOrFirstAvailableVariant: selectedVariant
    });

    // Track product view in recently viewed (with 1-second delay)
    // Stores full product data for offline display capability
    useEffect(() => {
        if (product?.id && product?.handle && product?.title) {
            const timeoutId = setTimeout(() => {
                const firstImage = extractImagesFromMedia(product.media?.nodes)?.[0];

                // Format price using the shared CurrencyFormatter for consistent symbol display
                const formatPrice = (price: {amount: string; currencyCode: string} | null | undefined) => {
                    if (!price) return "";
                    return formatShopifyMoney(price);
                };

                addProduct({
                    id: product.id,
                    handle: product.handle,
                    title: product.title,
                    imageUrl: firstImage?.url ?? null,
                    imageAlt: firstImage?.altText ?? null,
                    price: formatPrice(selectedVariant?.price),
                    compareAtPrice: selectedVariant?.compareAtPrice
                        ? formatPrice(selectedVariant.compareAtPrice)
                        : undefined
                });
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [product?.id, product?.handle, product?.title, product.media?.nodes, selectedVariant, addProduct]);

    const agentSurface = useAgentSurface();

    const {title, descriptionHtml} = product;
    const {badgeTypes} = getSpecialTags(product.tags);

    // Agent path: spec-first dense view — no image gallery, no carousels.
    if (agentSurface.isAgent) {
        return (
            <AgentProductBrief
                product={product}
                selectedVariant={selectedVariant}
                productOptions={productOptions}
            />
        );
    }

    return (
        <>
            {/* Mobile Layout (hidden on desktop) */}
            <div className="md:hidden">
                {/* 1. Product Images
                         - pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px)
                         - Additional small padding for gallery */}
                <div className="px-3 sm:px-4 pt-(--page-breathing-room)">
                    <ProductImageGallery
                        images={product.images.nodes}
                        selectedVariantImage={selectedVariant?.image}
                        media={product.media?.nodes}
                        isAvailableForSale={product.availableForSale}
                    />
                </div>

                {/* 2. Product Tags + Name + Discount Badge
                     Tags render directly above the title for consistent visual hierarchy
                     across the PDP, QuickAddSheet, and QuickAddDialog. */}
                <div className="px-3 sm:px-4 pt-4 sm:pt-6 space-y-2">
                    <ProductTagList tags={product.tags} />
                    <ProductTitle title={title} variant="pdp" />
                    <ProductDiscountBadge selectedVariant={selectedVariant} product={product} />
                </div>

                {/* 3. Description - Comprehensive prose typography */}
                <div className="px-3 sm:px-4 py-3 sm:py-4 pb-4 sm:pb-6">
                    <ProductDescription html={descriptionHtml} size="sm" />
                    <CatalogExtensionDisplay
                        isGiftCard={product.isGiftCard}
                        requiresShipping={selectedVariant?.requiresShipping}
                        sellingPlans={selectedVariant?.sellingPlanAllocations?.nodes?.map((a: any) => ({name: a.sellingPlan?.name ?? "Subscription", recurringDeliveries: a.sellingPlan?.recurringDeliveries ?? false}))}
                        collections={product.collections?.nodes?.map((c: any) => ({handle: c.handle, title: c.title}))}
                        className="pt-3"
                    />
                </div>

                {/* 5. Product Form — single implementation shared across all screen sizes */}
                <div id="product-hero-mobile" className="px-3 sm:px-4 py-6 sm:py-8">
                    <ProductForm
                        product={product}
                        productOptions={productOptions}
                        selectedVariant={selectedVariant}
                        sellingPlanGroups={product.sellingPlanGroups}
                        selectedSellingPlan={selectedSellingPlan}
                        tags={product.tags}
                        wishlistButton={
                            <WishlistButton
                                productId={product.id}
                                productTitle={product.title}
                                variant="primary-outline"
                            />
                        }
                        shareButton={
                            <ProductShareButton product={product} selectedVariant={selectedVariant} />
                        }
                    />
                </div>
            </div>

            {/* Desktop Layout (hidden on mobile)
                     Responsive margins scale from md to 3xl for ultrawide support.
                     At 3xl (1921px+), content is max-width constrained and centered.
                     - pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px)
                     Product pages use standard breathing room (not dense) because the sidebar
                     is for navigation, not high-density content like collection grids. */}
            <div className="hidden md:block pt-(--page-breathing-room) mx-4 lg:mx-6 xl:mx-8 2xl:mx-12 3xl:mx-auto 3xl:max-w-400 3xl:px-12 mb-4">
                {/* Main 3-Column Layout (Desktop)
                         Gap scales progressively for visual rhythm at larger screens */}
                <div className="flex gap-8 lg:gap-12 xl:gap-14 2xl:gap-16">
                    {/* Desktop Sidebar - sticky, positioned using same breathing room as page padding
                             Uses --page-breathing-room for consistent alignment with standard pages.
                             When scrolled, header adds pt-3 (12px), so sidebar adds matching offset.
                             - Base: --total-header-height + --page-breathing-room
                             - Scrolled: +0.75rem (12px) to match header's pt-3 floating effect
                             - z-10 ensures sidebar stays below header (z-100) but above page content */}
                    <div className="w-72 lg:w-80 xl:w-84 2xl:w-88 shrink-0 animate-slide-right-fade">
                        <div
                            className={cn(
                                "sticky z-10 transition-[top] duration-300 ease-out",
                                isScrolled
                                    ? "top-[calc(var(--total-header-height)+0.75rem+var(--page-breathing-room))]"
                                    : "top-[calc(var(--total-header-height)+var(--page-breathing-room))]"
                            )}
                        >
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
                                        const discountCount = countDiscountedProducts(
                                            allProducts.nodes as LightweightProduct[]
                                        );
                                        return (
                                            <CollectionSidebar
                                                collections={collectionsWithCounts}
                                                activeHandle={activeCollectionHandle}
                                                totalProductCount={totalProductCount}
                                                discountCount={discountCount}
                                            />
                                        );
                                    }}
                                </Await>
                            </Suspense>
                        </div>
                    </div>

                    {/* Image Gallery + Product Info */}
                    <div className="flex-1 min-w-0">
                        <div className="grid md:grid-cols-2 gap-8 md:gap-12 xl:gap-14 2xl:gap-16">
                            {/* Product Image Gallery — scrolls normally on lg+ screens.
                                     No self-start: defaults to stretch so this grid item fills the row height
                                     set by the copy column, which is the taller element when media is short.
                                     The media column's natural height drives the grid row height. */}
                            <div>
                                <ProductImageGallery
                                    images={product.images.nodes}
                                    selectedVariantImage={selectedVariant?.image}
                                    media={product.media?.nodes}
                                    isAvailableForSale={product.availableForSale}
                                />
                            </div>
                            {/* Product Info — sticky on lg+ screens until all product media scrolls away.
                                     Outer div has no self-start: stretches to fill the row height set by the
                                     taller media column, giving the inner sticky element room to travel.
                                     Sticky releases naturally when the row's bottom exits the viewport
                                     sticky threshold — i.e. after all left-side media has scrolled past. */}
                            <div>
                                <div
                                    className={cn(
                                        "space-y-6 animate-slide-left-fade lg:sticky lg:transition-[top] lg:duration-300 lg:ease-out",
                                        isScrolled
                                            ? "lg:top-[calc(var(--total-header-height)+0.75rem+var(--page-breathing-room))]"
                                            : "lg:top-[calc(var(--total-header-height)+var(--page-breathing-room))]"
                                    )}
                                    style={{animationDelay: "100ms"}}
                                >
                                {/* Product Tag Badges - desktop only, hidden on mobile */}
                                {badgeTypes.length > 0 && (
                                    <div className="hidden items-center gap-2 lg:flex">
                                        <ProductBadgeStack types={badgeTypes} />
                                    </div>
                                )}
                                {/* Product Tags + Title + Discount Badge
                                         Tags render directly above the title for consistent visual
                                         hierarchy across the PDP, QuickAddSheet, and QuickAddDialog.
                                         Title scales progressively: 30px → 36px → 44px → 48px. */}
                                <div className="space-y-3 mb-12 lg:mb-16 xl:mb-20 2xl:mb-24">
                                    <ProductTagList tags={product.tags} />
                                    <ProductTitle title={title} variant="pdp" />
                                    <ProductDiscountBadge selectedVariant={selectedVariant} product={product} />
                                </div>
                                <ProductForm
                                    product={product}
                                    productOptions={productOptions}
                                    selectedVariant={selectedVariant}
                                    sellingPlanGroups={product.sellingPlanGroups}
                                    selectedSellingPlan={selectedSellingPlan}
                                    tags={product.tags}
                                    wishlistButton={
                                        <WishlistButton
                                            productId={product.id}
                                            productTitle={product.title}
                                            variant="primary-outline"
                                        />
                                    }
                                    shareButton={
                                        <ProductShareButton product={product} selectedVariant={selectedVariant} />
                                    }
                                />
                                {/* Product Description - Comprehensive prose typography for desktop */}
                                <ProductDescription html={descriptionHtml} size="base" className="pt-12" />
                                <CatalogExtensionDisplay
                                    isGiftCard={product.isGiftCard}
                                    requiresShipping={selectedVariant?.requiresShipping}
                                    sellingPlans={selectedVariant?.sellingPlanAllocations?.nodes?.map((a: any) => ({name: a.sellingPlan?.name ?? "Subscription", recurringDeliveries: a.sellingPlan?.recurringDeliveries ?? false}))}
                                    collections={product.collections?.nodes?.map((c: any) => ({handle: c.handle, title: c.title}))}
                                    className="pt-4"
                                />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Suspense fallback={null}>
                <Await resolve={reviews}>
                    {resolvedReviews => <ProductReviews reviews={resolvedReviews ?? []} />}
                </Await>
            </Suspense>

            <RelatedProducts products={recommendations} />

            <Analytics.ProductView
                data={{
                    products: [
                        {
                            id: product.id,
                            title: product.title,
                            price: selectedVariant?.price.amount || "0",
                            vendor: product.vendor,
                            variantId: selectedVariant?.id || "",
                            variantTitle: selectedVariant?.title || "",
                            quantity: 1
                        }
                    ]
                }}
            />

            {/* Sticky "Get it Now" button for mobile - appears when ProductHeroMobile is scrolled out of view */}
            <StickyMobileGetNow
                targetId="product-hero-mobile"
                buttonText={hasSpecialTag(product.tags, "preorder") ? "Pre Order" : "Get it Now"}
                selectedVariant={selectedVariant}
            />
        </>
    );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    quantityAvailable
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    barcode
    currentlyNotInStock
    requiresShipping
    title
    unitPrice {
      amount
      currencyCode
    }
    sellingPlanAllocations(first: 10) {
      nodes {
        sellingPlan {
          id
          name
          options {
            name
            value
          }
          priceAdjustments {
            adjustmentValue {
              __typename
              ... on SellingPlanPercentagePriceAdjustment {
                adjustmentPercentage
              }
              ... on SellingPlanFixedAmountPriceAdjustment {
                adjustmentAmount {
                  amount
                  currencyCode
                }
              }
              ... on SellingPlanFixedPriceAdjustment {
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
        priceAdjustments {
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          perDeliveryPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    tags
    publishedAt
    isGiftCard
    encodedVariantExistence
    encodedVariantAvailability
    collections(first: 5) {
      nodes {
        id
        handle
        title
      }
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
    media(first: 10) {
      nodes {
        __typename
        mediaContentType
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
            height
            width
          }
          previewImage {
            url
            altText
            width
            height
          }
        }
        ... on ExternalVideo {
          id
          alt
          embedUrl
          previewImage {
            url
            altText
            width
            height
          }
        }
        ... on Model3d {
          id
          alt
          previewImage {
            url
            altText
            width
            height
          }
        }
      }
    }
    variants(first: 10) {
      nodes {
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
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    requiresSellingPlan
    sellingPlanGroups(first: 5) {
      nodes {
        name
        appName
        options {
          name
          values
        }
        sellingPlans(first: 10) {
          nodes {
            id
            name
            description
            recurringDeliveries
            options {
              name
              value
            }
            priceAdjustments {
              adjustmentValue {
                __typename
                ... on SellingPlanPercentagePriceAdjustment {
                  adjustmentPercentage
                }
                ... on SellingPlanFixedAmountPriceAdjustment {
                  adjustmentAmount {
                    amount
                    currencyCode
                  }
                }
                ... on SellingPlanFixedPriceAdjustment {
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;



// Fragment for recommended products
const RECOMMENDED_PRODUCT_FRAGMENT = `#graphql
  fragment RecommendedProduct on Product {
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
    variants(first: 3) {
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
` as const;

// Query to fetch product recommendations
const RECOMMENDATIONS_QUERY = `#graphql
  query ProductPageRecommendations(
    $productId: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      ...RecommendedProduct
    }
  }
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;

const PRODUCT_REVIEWS_QUERY = `#graphql
  query ProductReviews($id: ID!) {
    product(id: $id) {
      reviews: metafield(namespace: "custom", key: "reviews") {
        references(first: 20) {
          nodes {
            ... on Metaobject {
              reviewerName: field(key: "reviewer_name") { value }
              rating: field(key: "rating") { value }
              reviewTitle: field(key: "review_title") { value }
              body: field(key: "body") { value }
              date: field(key: "date") { value }
            }
          }
        }
      }
    }
  }
` as const;

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

/**
 * Route-specific error boundary for product pages.
 * Shows contextual error message (e.g., "Product Not Found").
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

    // Track error via analytics (client-side only)
    const errorType = isRouteErrorResponse(error) ? "route_error" : "js_error";
    if (typeof window !== "undefined") {
        setTimeout(() => trackErrorBoundary(statusCode, errorType, "products"), 0);
    }

    // Use product-specific 404 title
    const title = statusCode === 404 ? "Product Not Found" : undefined;

    return <OfflineAwareErrorPage statusCode={statusCode} title={title} message={errorMessage} />;
}
