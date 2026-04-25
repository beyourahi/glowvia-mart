/**
 * @fileoverview HomepageWishlistSection - Bento grid wishlist preview with client-side fetching
 *
 * @description
 * Displays user's wishlist in an asymmetric bento grid layout with featured item.
 * Fetches product data client-side from localStorage IDs via API route. Only renders
 * when user has wishlist items (post-hydration).
 *
 * @features
 * - **Bento Grid Layout**: Featured item (2x2) + smaller items (1x1) with responsive stacking
 * - **Client-Side Fetching**: Fetches products from wishlist IDs via /api/wishlist-products
 * - **Hydration Safe**: Waits for client hydration before rendering
 * - **Loading States**: Skeleton matching bento grid layout
 * - **Responsive Cards**: Aspect ratio adjustments for mobile (4:5) and full-width items (8:5)
 * - **Gradient Overlays**: Always visible on mobile, hover reveal on desktop
 *
 * @props
 * - className: Optional container className
 *
 * @related
 * - lib/wishlist-context.tsx - Wishlist localStorage management
 * - routes/api.wishlist-products.ts - API endpoint for fetching products by IDs
 * - lib/wishlist-utils.ts - GID reconstruction utilities
 */

import {useEffect, useState} from "react";
import {Link, useFetcher} from "react-router";
import {Image} from "@shopify/hydrogen";
import type {ProductItemFragment} from "storefrontapi.generated";
import {useWishlist} from "~/lib/wishlist-context";
import {reconstructGids} from "~/lib/wishlist-utils";
import {ProductPrice} from "~/components/ProductPrice";
import {WishlistButton} from "~/components/WishlistButton";
import {Skeleton} from "~/components/ui/skeleton";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {cn} from "~/lib/utils";
import {parseProductTitle} from "~/lib/product";

// ============================================================================
// Types
// ============================================================================

interface HomepageWishlistSectionProps {
    className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * HomepageWishlistSection - Bento Grid layout wishlist preview
 *
 * Bento Grid Structure:
 * - **Featured item**: 2x2 grid cells (col-span-2 row-span-2) with large overlay text
 * - **Other items**: 1x1 grid cells with hover reveal info
 * - **View More tile**: Appears when more than 4 items exist
 *
 * Responsive behavior:
 * - Mobile (2 columns): Items stack with full-width last item if odd count
 * - Tablet+ (4 columns): Fixed bento grid with consistent heights
 *
 * Features:
 * - Asymmetric grid with featured item larger (2x2)
 * - Clean gradient overlays with hover reveals
 * - Client-side product fetching (localStorage wishlist)
 * - Only renders when user has wishlist items
 * - Animated entrance
 */
export function HomepageWishlistSection({className}: HomepageWishlistSectionProps) {
    const {ids, count, isHydrated} = useWishlist();
    const fetcher = useFetcher<{products: ProductItemFragment[]; error: string | null}>();
    // Track the IDs we've submitted to prevent duplicate requests
    const [submittedIds, setSubmittedIds] = useState<string | null>(null);

    // Fetch products when wishlist IDs are available
    useEffect(() => {
        if (!isHydrated) return;
        if (ids.length === 0) return;

        // Create a stable key for the current IDs
        const idsKey = ids.join(",");

        // Don't re-fetch if we've already submitted for these IDs
        if (submittedIds === idsKey) return;

        // Don't submit if already loading
        if (fetcher.state !== "idle") return;

        // Convert numeric IDs to GIDs for the API
        const gids = reconstructGids(ids);

        const formData = new FormData();
        formData.set("ids", JSON.stringify(gids));

        void fetcher.submit(formData, {
            method: "POST",
            action: "/api/wishlist-products"
        });

        // Mark that we've submitted for these IDs
        setSubmittedIds(idsKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher.submit is stable, only need fetcher.state
    }, [isHydrated, ids, fetcher.state, submittedIds]);

    // Don't render if not hydrated yet (prevents layout shift)
    if (!isHydrated) return null;

    // Don't render if no wishlist items
    if (count === 0) return null;

    // Loading state: show skeleton while fetching or if we haven't received data yet
    const hasData = fetcher.data !== undefined;
    const isLoading = fetcher.state !== "idle" || !hasData;

    if (isLoading) {
        return (
            <div className={cn("", className)}>
                <WishlistSectionSkeleton />
            </div>
        );
    }

    const products = fetcher.data?.products ?? [];

    // Don't render if no valid products (all deleted/unavailable)
    if (products.length === 0) return null;

    // Get featured product (first one) and remaining
    const [featuredProduct, ...otherProducts] = products;
    const displayProducts = otherProducts.slice(0, 3); // Max 3 additional products
    const remainingCount = Math.max(0, products.length - 4);

    return (
        <section className={cn("", className)}>
            {/* Section Header */}
            <div className="mb-8 md:mb-12">
                <div className="flex items-center justify-between">
                    {/* Heading and subheading on the left */}
                    <div>
                        <h2 className="font-serif text-xl font-medium text-primary md:text-3xl lg:text-4xl mb-0">
                            Wishlist
                        </h2>
                        <p className="mt-1 text-base text-muted-foreground md:text-lg">
                            {products.length} item{products.length !== 1 ? "s" : ""} you&apos;ve saved
                        </p>
                    </div>
                    {/* View All Button - Desktop (pill style matching Recently Viewed) */}
                    <Link
                        to="/wishlist"
                        viewTransition
                        className="hidden rounded-[var(--radius-pill-raw)] border-2 border-primary px-3 sm:px-4 py-2 font-sans text-sm font-medium text-primary motion-interactive hover:bg-primary hover:text-primary-foreground sm:inline-flex"
                    >
                        View all
                    </Link>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-responsive h-auto sm:h-[400px] lg:h-[480px]">
                {/* Featured Product - Spans 2 cols and 2 rows */}
                <FeaturedWishlistCard product={featuredProduct} />

                {/* Other Products */}
                {displayProducts.map((product, index) => {
                    // Calculate total items after featured (products + ViewMoreTile)
                    const totalAfterFeatured = displayProducts.length + (remainingCount > 0 ? 1 : 0);
                    // On mobile (2-col grid), if odd items and this is the last one, span full width
                    const isLastItem = index === displayProducts.length - 1;
                    const isOddTotal = totalAfterFeatured % 2 === 1;
                    const spanFullOnMobile = isLastItem && isOddTotal && remainingCount === 0;

                    return (
                        <WishlistCard
                            key={product.id}
                            product={product}
                            index={index}
                            spanFullOnMobile={spanFullOnMobile}
                        />
                    );
                })}

                {/* View More Tile (if more products) */}
                {remainingCount > 0 && <ViewMoreTile count={remainingCount} />}
            </div>

            {/* View All Button - Mobile (pill style matching Recently Viewed) */}
            <div className="mt-6 flex justify-center sm:hidden">
                <Link
                    to="/wishlist"
                    viewTransition
                    className="rounded-[var(--radius-pill-raw)] border-2 border-primary px-3 sm:px-4 py-2 font-sans text-sm font-medium text-primary motion-interactive hover:bg-primary hover:text-primary-foreground"
                >
                    View all
                </Link>
            </div>
        </section>
    );
}

/**
 * Featured product card - larger, spans 2x2, with always-visible info
 */
function FeaturedWishlistCard({product}: {product: ProductItemFragment}) {
    const {canHover} = usePointerCapabilities();
    const {primary, secondary} = parseProductTitle(product.title);

    return (
        <Link
            to={`/products/${product.handle}`}
            prefetch="viewport"
            viewTransition
            className={cn(
                "col-span-2 row-span-2 relative overflow-hidden rounded-2xl cursor-pointer",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
            )}
        >
            {/* Background Image */}
            {product.featuredImage && (
                <Image
                    data={product.featuredImage}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={cn(
                        "w-full h-full object-cover aspect-square sm:aspect-auto motion-image",
                        canHover && "group-hover:scale-105"
                    )}
                />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Wishlist Button - enhanced with breathing animation on hover */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                <WishlistButton
                    productId={product.id}
                    productTitle={product.title}
                    size="sm"
                    variant="floating"
                    animateOnParentHover
                />
            </div>

            {/* Featured Badge */}
            <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-red-500 text-white text-sm font-medium px-2.5 py-1 rounded-[var(--radius-pill-raw)]">
                Featured
            </span>

            {/* Product Info - Bottom overlay */}
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                <h3 className="text-white text-lg sm:text-2xl font-medium mb-2 sm:mb-3 line-clamp-1">
                    <span>{primary}</span>
                    {secondary && <span>, {secondary}</span>}
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-white text-lg sm:text-xl font-bold">
                        <ProductPrice price={product.priceRange.minVariantPrice} />
                    </span>
                    <span
                        className={cn(
                            "text-sm hidden sm:inline motion-link",
                            canHover ? "text-white/60 group-hover:text-white" : "text-white/80"
                        )}
                    >
                        View details →
                    </span>
                </div>
            </div>
        </Link>
    );
}

/**
 * Regular wishlist card - clean with hover info reveal
 */
function WishlistCard({
    product,
    index,
    spanFullOnMobile = false
}: {
    product: ProductItemFragment;
    index: number;
    spanFullOnMobile?: boolean;
}) {
    const {canHover} = usePointerCapabilities();
    const {primary, secondary} = parseProductTitle(product.title);

    return (
        <Link
            to={`/products/${product.handle}`}
            prefetch="viewport"
            viewTransition
            className={cn(
                "relative overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer sm:aspect-auto",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]",
                spanFullOnMobile
                    ? "col-span-2 sm:col-span-1 aspect-8/5" // 2x width needs 2x wider aspect to match height
                    : "aspect-4/5"
            )}
            style={{animationDelay: `${index * 100}ms`}}
        >
            {/* Background Image */}
            {product.featuredImage && (
                <Image
                    data={product.featuredImage}
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className={cn(
                        "w-full h-full object-cover motion-image",
                        canHover && "group-hover:scale-105"
                    )}
                />
            )}

            {/* Overlay with Info - Always visible on mobile, hover on desktop */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/70 to-transparent motion-overlay",
                    canHover ? "sm:opacity-0 sm:group-hover:opacity-100" : "opacity-100"
                )}
            >
                <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-white font-medium text-sm line-clamp-1">
                        <span>{primary}</span>
                        {secondary && <span>, {secondary}</span>}
                    </h4>
                    <div className="text-white/70 text-sm mt-0.5">
                        <ProductPrice price={product.priceRange.minVariantPrice} />
                    </div>
                </div>
            </div>

            {/* Wishlist Button - enhanced with breathing animation on hover */}
            <div className="absolute top-2 right-2 z-10">
                <WishlistButton
                    productId={product.id}
                    productTitle={product.title}
                    size="sm"
                    variant="floating"
                    animateOnParentHover
                />
            </div>
        </Link>
    );
}

/**
 * View more tile - links to full wishlist
 */
function ViewMoreTile({count}: {count: number}) {
    const {canHover} = usePointerCapabilities();

    return (
        <Link
            to="/wishlist"
            prefetch="viewport"
            viewTransition
            className={cn(
                "flex flex-col items-center justify-center rounded-xl sm:rounded-2xl bg-black text-white cursor-pointer aspect-[4/5] sm:aspect-auto motion-interactive",
                canHover
                    ? "group hover:bg-gray-900"
                    : "motion-press active:bg-gray-900 active:scale-[var(--motion-press-scale)]"
            )}
        >
            <span
                className={cn(
                    "text-3xl sm:text-4xl font-light mb-1 motion-interactive",
                    canHover && "group-hover:scale-110"
                )}
            >
                +{count}
            </span>
            <span className="text-sm opacity-70">more items</span>
        </Link>
    );
}

/**
 * Loading skeleton - matches actual section layout
 */
function WishlistSectionSkeleton() {
    return (
        <div>
            {/* Header skeleton - matches section header */}
            <div className="mb-8 md:mb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-0">
                            <Skeleton className="w-8 h-8 md:w-10 md:h-10 rounded-full" />
                            <Skeleton className="h-10 w-48 md:h-12 md:w-64 lg:h-14 lg:w-80" />
                        </div>
                        <Skeleton className="mt-2 h-5 w-32 md:h-6 md:w-40" />
                    </div>
                    <Skeleton className="hidden sm:block h-12 w-28 rounded-[var(--radius-pill-raw)]" />
                </div>
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-responsive h-auto sm:h-[400px] lg:h-[480px]">
                <Skeleton className="col-span-2 row-span-2 aspect-square sm:aspect-auto rounded-2xl" />
                <Skeleton className="aspect-4/5 sm:aspect-auto rounded-xl sm:rounded-2xl" />
                <Skeleton className="aspect-4/5 sm:aspect-auto rounded-xl sm:rounded-2xl" />
            </div>

            {/* Mobile button skeleton */}
            <div className="mt-6 flex justify-center sm:hidden">
                <Skeleton className="h-11 w-28 rounded-[var(--radius-pill-raw)]" />
            </div>
        </div>
    );
}
