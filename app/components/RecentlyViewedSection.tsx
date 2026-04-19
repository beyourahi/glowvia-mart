/**
 * @fileoverview RecentlyViewedSection - Product browsing history with offline support
 *
 * @description
 * Displays recently viewed products from localStorage with SSR/client hydration handling.
 * Supports both online (rich Shopify data) and offline (localStorage cache) modes.
 * Includes clear history dialog with body scroll locking.
 *
 * @features
 * - **Hybrid Data Sources**: SSR products (cookies) + client products (localStorage)
 * - **Offline Support**: localStorage stores full product data for offline display
 * - **Clear History**: Confirmation dialog with Lenis scroll lock integration
 * - **Carousel Display**: Embla Carousel with drag-free scrolling
 * - **Hydration Safe**: Waits for client hydration before rendering localStorage data
 * - **Loading States**: Skeleton matching actual carousel layout
 *
 * @props
 * - products: Pre-fetched products from server (SSR via cookies)
 * - allProducts: Full product catalog for client-side matching
 * - loading: Show loading skeleton
 *
 * @related
 * - lib/recently-viewed.ts - localStorage management and hooks
 * - routes/_index.tsx - Server-side product fetching from cookies
 * - LenisProvider.tsx - Smooth scroll locking for dialogs
 */

import {useState, useCallback, useMemo} from "react";
import {Link} from "react-router";
import type {ProductItemFragment, CuratedProductFragment} from "storefrontapi.generated";
import {useRecentlyViewed, type RecentlyViewedProduct} from "~/lib/recently-viewed";
import {useScrollLock} from "~/hooks/useScrollLock";
import {ProductItem} from "~/components/ProductItem";
import {RecentlyViewedSkeleton} from "~/components/skeletons";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "~/components/ui/dialog";
import {parseProductTitle} from "~/lib/product";

// ============================================================================
// Types
// ============================================================================

interface RecentlyViewedSectionProps {
    /** Products pre-fetched from server (SSR) */
    products: (ProductItemFragment | CuratedProductFragment)[];
    /** All available products for client-side filtering */
    allProducts?: (ProductItemFragment | CuratedProductFragment)[];
    /** Show loading skeleton */
    loading?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RecentlyViewedSection - Product browsing history carousel
 *
 * Data source priority (after hydration):
 * 1. **Online mode**: Match localStorage IDs with allProducts for richest data
 * 2. **Offline mode**: Use full product data stored in localStorage
 * 3. **Pre-hydration**: Use SSR products from cookies
 *
 * The component waits for client hydration before showing localStorage data
 * to prevent server/client mismatches. During this time, it shows SSR products.
 */
export function RecentlyViewedSection({products, allProducts = [], loading = false}: RecentlyViewedSectionProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [historyCleared, setHistoryCleared] = useState(false);

    const recentlyViewed = useRecentlyViewed();
    // Destructure stable callbacks so we can use them as exhaustive-deps without
    // depending on the whole recentlyViewed object reference
    const {clear: clearRecentlyViewed} = recentlyViewed;

    // Lock body scroll when dialog is open
    useScrollLock(dialogOpen);

    // Derive the products to display
    // Priority: localStorage (full data for offline) > allProducts lookup > SSR products
    type DisplayProduct =
        | {type: "server"; data: ProductItemFragment | CuratedProductFragment}
        | {type: "offline"; data: RecentlyViewedProduct};

    // Memoize so the array reference is stable when inputs haven't changed,
    // preventing the carousel from unnecessarily re-rendering
    const displayProducts = useMemo<DisplayProduct[]>(() => {
        if (historyCleared) return [];

        // After hydration, localStorage has full product data for offline display
        if (recentlyViewed.isHydrated && recentlyViewed.products.length > 0) {
            // First try to match with allProducts for richest data (online)
            if (allProducts.length > 0) {
                const storeProductIds = recentlyViewed.productIds;
                const matchedProducts = allProducts
                    .filter(product => product && product.id && storeProductIds.includes(product.id))
                    .sort((a, b) => {
                        const aIndex = storeProductIds.indexOf(a.id);
                        const bIndex = storeProductIds.indexOf(b.id);
                        return aIndex - bIndex;
                    })
                    .slice(0, 10);

                if (matchedProducts.length > 0) {
                    return matchedProducts.map(data => ({type: "server" as const, data}));
                }
            }

            // Fall back to localStorage data (offline mode)
            // This works because we now store full product data (title, image, price)
            return recentlyViewed.products.slice(0, 10).map(data => ({type: "offline" as const, data}));
        }

        // Before hydration: use server-provided products from cookies
        if (products && products.length > 0) {
            return products
                .filter(product => product && product.id && product.handle)
                .slice(0, 10)
                .map(data => ({type: "server" as const, data}));
        }

        return [];
    }, [historyCleared, recentlyViewed.isHydrated, recentlyViewed.products, recentlyViewed.productIds, allProducts, products]);

    // Determine if section should show
    // Don't hide until we've checked localStorage (wait for hydration)
    const shouldShowSection = (() => {
        if (historyCleared) return false;
        if (loading) return true;
        // If not hydrated yet and no SSR products, wait for hydration
        if (!recentlyViewed.isHydrated && products.length === 0) return false;
        return displayProducts.length >= 1;
    })();

    // Stable — only changes when clear() changes (which is itself stable via useCallback in the hook)
    const handleClearHistory = useCallback(() => {
        clearRecentlyViewed();
        setDialogOpen(false);
        setHistoryCleared(true);
    }, [clearRecentlyViewed]);

    if (!shouldShowSection) return null;

    const isLoading = loading && displayProducts.length === 0;

    return (
        <>
            <section className="py-12 md:py-16">
                {/* Section Header */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center justify-between">
                        {/* Heading and subheading on the left */}
                        <div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <h2 className="font-serif text-xl font-medium text-primary md:text-3xl lg:text-4xl mb-0">
                                    Recently Viewed
                                </h2>
                                {!isLoading && displayProducts.length > 0 && (
                                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 font-sans text-xs font-medium text-primary md:px-2.5 md:text-sm">
                                        {displayProducts.length}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-base text-muted-foreground md:text-lg">
                                {isLoading
                                    ? "Loading your history..."
                                    : "Products you've recently browsed"}
                            </p>
                        </div>
                        {/* Clear History Button - Desktop (pill style matching Instagram handle) */}
                        {!isLoading && displayProducts.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setDialogOpen(true)}
                                className="hidden select-none rounded-full border-2 border-primary px-3 sm:px-4 py-2 font-sans text-sm font-medium text-primary motion-interactive hover:bg-primary hover:text-primary-foreground sm:inline-flex"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Products Carousel */}
                {isLoading ? (
                    <RecentlyViewedSkeleton />
                ) : (
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                            dragFree: true
                        }}
                        plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                        className="w-full"
                    >
                        {/* pt-4 accommodates pin badge overflow (-top-2 to -top-2.5) */}
                        <CarouselContent className="-ml-2 md:-ml-3 pt-4">
                            {displayProducts.map(item => (
                                <CarouselItem
                                    key={item.data.id}
                                    className="basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%] pl-2 md:pl-3"
                                >
                                    {item.type === "server" ? (
                                        <ProductItem product={item.data} />
                                    ) : (
                                        <OfflineProductCard product={item.data} />
                                    )}
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                )}

                {/* Clear History Button - Mobile (pill style matching Instagram handle) */}
                {!isLoading && displayProducts.length > 0 && (
                    <div className="mt-6 flex justify-center sm:hidden">
                        <button
                            type="button"
                            onClick={() => setDialogOpen(true)}
                            className="select-none rounded-full border-2 border-primary px-3 sm:px-4 py-2 font-sans text-sm font-medium text-primary motion-interactive hover:bg-primary hover:text-primary-foreground"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </section>

            {/* Clear History Confirmation Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-2xl border-0 p-8 sm:max-w-md" showCloseButton={false}>
                    <DialogHeader className="space-y-3 pr-0 sm:pr-0">
                        <DialogTitle className="font-serif text-lg font-medium text-primary">
                            Clear History
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                            Remove all {displayProducts.length} recently viewed{" "}
                            {displayProducts.length === 1 ? "product" : "products"} from your browsing history?
                        </DialogDescription>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground/80 text-center sm:text-left">
                        This action cannot be undone.
                    </p>

                    <DialogFooter className="mt-2 flex-col gap-3 sm:flex-row sm:gap-4">
                        <button
                            type="button"
                            onClick={() => setDialogOpen(false)}
                            className="w-full select-none rounded-full border-2 border-primary px-3 sm:px-4 py-2.5 font-sans text-base font-medium text-primary motion-interactive hover:bg-primary hover:text-primary-foreground sm:w-auto"
                        >
                            Keep History
                        </button>
                        <button
                            type="button"
                            onClick={handleClearHistory}
                            className="w-full select-none rounded-full bg-primary px-3 sm:px-4 py-2.5 font-sans text-base font-medium text-primary-foreground motion-interactive hover:bg-primary/90 sm:w-auto"
                        >
                            Clear All
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

/**
 * Lightweight product card for offline display.
 * Renders from localStorage data without needing server/GraphQL data.
 * Styled to match ProductItem for visual consistency.
 */
function OfflineProductCard({product}: {product: RecentlyViewedProduct}) {
    const {primary: mainTitle, secondary: subtitle} = parseProductTitle(product.title);

    return (
        <Link to={`/products/${product.handle}`} className="group block">
            {/* Product Image */}
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl bg-secondary/10">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.imageAlt || product.title}
                        className="size-full object-cover motion-image group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                        <span className="text-sm">No image</span>
                    </div>
                )}

                {/* Sale Badge */}
                {product.compareAtPrice && product.compareAtPrice !== product.price && (
                    <div className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-sm font-semibold text-destructive-foreground">
                        Sale
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="mt-3 space-y-1">
                <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary motion-link">
                    {mainTitle}
                </h3>
                {subtitle && <p className="text-sm text-muted-foreground line-clamp-1">{subtitle}</p>}

                {/* Price */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{product.price}</span>
                    {product.compareAtPrice && product.compareAtPrice !== product.price && (
                        <span className="text-sm text-muted-foreground line-through">{product.compareAtPrice}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
