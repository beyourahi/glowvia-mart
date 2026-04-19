/**
 * @fileoverview Main Cart Display Component
 *
 * @description
 * The primary cart component that renders cart items and order summary.
 * Supports two layout modes: full page view and aside (drawer) view.
 * Uses optimistic updates for instant user feedback on cart changes.
 * Provides empty state with product suggestions and comprehensive cart features.
 *
 * @layouts
 * - "page": Full-width layout for /cart route
 *   - Two-column grid on desktop (items + sticky summary)
 *   - Stacked layout on mobile
 * - "aside": Compact layout for cart drawer
 *   - Fixed header with item count
 *   - Scrollable items list
 *   - Fixed summary at bottom
 *
 * @features
 * - Optimistic cart updates (useOptimisticCart) for instant feedback
 * - Empty state with product suggestions carousel
 * - Product suggestion carousel (8 random products, shuffled)
 * - Store credit support notification
 * - Free shipping progress indicator
 * - Staggered fade-in animations for cart items
 * - Lenis scroll prevention for native scrolling
 * - Safe area padding for iOS devices
 *
 * @architecture
 * Component structure:
 * - CartMain: Main wrapper, handles layout switching
 * - CartAsideHeader: Header for drawer layout with close button
 * - CartEmpty: Empty state with suggestions
 * - CartSuggestions: Product carousel (aside only)
 * - ProductItem: Reusable product card (with compactMode) for carousel
 *
 * @props
 * - layout: "page" or "aside" - determines rendering mode
 * - cart: Cart data from Shopify Hydrogen (optimistic)
 * - isLoggedIn: Whether customer is authenticated
 * - hasStoreCredit: Whether customer has store credit
 * - shippingConfig: Free shipping threshold configuration
 *
 * @accessibility
 * - role="list" for cart items
 * - aria-label for cart items list
 * - Proper heading hierarchy
 * - Screen reader-friendly labels
 * - 44px minimum touch targets
 *
 * @related
 * - CartLineItem.tsx - Individual cart item display
 * - CartSummary.tsx - Totals, discounts, and checkout
 * - ~/routes/cart.tsx - Cart route and action handler
 * - Aside.tsx - Drawer container
 * - PageLayout.tsx - Renders CartSheet with cart data
 * - root.tsx - Provides cartSuggestions data
 */

import {Suspense, useCallback} from "react";
import {useOptimisticCart, Image} from "@shopify/hydrogen";
import {ShoppingCart} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Await, Link, useRouteLoaderData} from "react-router";
import type {CartLayout, CartMainProps} from "types";
import type {RootLoader} from "~/root";
import {useAside} from "~/components/Aside";
import {CartLineItem} from "~/components/CartLineItem";
import {CartSummary} from "./CartSummary";
import {Empty, EmptyHeader, EmptyMedia, EmptyTitle} from "~/components/ui/empty";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext} from "~/components/ui/carousel";
import {Skeleton} from "~/components/ui/skeleton";
import {cn} from "~/lib/utils";
import {ProductItem} from "~/components/ProductItem";
import type {CartSuggestionProductFragment} from "storefrontapi.generated";

export type {CartLayout, CartMainProps};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * The main cart component that displays cart items and summary.
 * Used by both the /cart route and the cart aside drawer.
 *
 * @param layout - Display mode: "page" for full page, "aside" for drawer
 * @param cart - Cart data from Hydrogen cart API
 * @param isLoggedIn - Whether customer is authenticated
 * @param hasStoreCredit - Whether customer has store credit available
 * @param shippingConfig - Free shipping threshold configuration
 */
export function CartMain({layout, cart: originalCart, isLoggedIn, hasStoreCredit, shippingConfig}: CartMainProps) {
    // The useOptimisticCart hook applies pending actions to the cart
    // so the user immediately sees feedback when they modify the cart.
    const cart = useOptimisticCart(originalCart);

    const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
    const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
    const isPage = layout === "page";
    const rootData = useRouteLoaderData<RootLoader>("root");

    // Page layout: two-column grid on desktop, stacked on mobile/tablet
    // Grid scales for ultrawide: summary column grows from 380px to 480px
    if (isPage) {
        return (
            <div className="w-full">
                <CartEmpty hidden={linesCount} layout={layout} />
                {linesCount && (
                    <div className="grid gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 2xl:gap-16 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_460px] 3xl:grid-cols-[1fr_480px] lg:items-start">
                        {/* Cart items list - responsive spacing */}
                        <div
                            role="list"
                            aria-label="Cart items"
                            className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6"
                        >
                            {(cart?.lines?.nodes ?? []).map(line => (
                                <CartLineItem key={line.id} line={line} layout={layout} />
                            ))}
                        </div>
                        {/* Cart summary - sticky on desktop with responsive top offset */}
                        {cartHasItems && (
                            <div className="lg:sticky lg:top-28 xl:top-32 2xl:top-36">
                                <CartSummary
                                    cart={cart}
                                    layout={layout}
                                    isLoggedIn={isLoggedIn}
                                    hasStoreCredit={hasStoreCredit}
                                    shippingConfig={shippingConfig}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Aside layout: fixed header, scrollable items, fixed summary at bottom
    return (
        <div className="flex flex-1 min-h-0 flex-col">
            {/* Fixed header - always visible in both empty and filled cart states */}
            <CartAsideHeader itemCount={cart?.totalQuantity ?? 0} />

            {/* Scrollable items area - data-lenis-prevent allows native scroll when Lenis is active */}
            <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-2 sm:px-4 pt-4" data-lenis-prevent>
                <CartEmpty hidden={linesCount} layout={layout} />
                {linesCount && (
                    <div role="list" aria-label="Cart items" className="space-y-3">
                        {(cart?.lines?.nodes ?? []).map((line, index) => (
                            <div
                                key={line.id}
                                className="animate-cart-item-enter"
                                style={{animationDelay: `${Math.min(index, 5) * 50}ms`}}
                            >
                                <CartLineItem line={line} layout={layout} />
                            </div>
                        ))}
                    </div>
                )}
                {/* Product suggestions — renders for both empty and non-empty cart states */}
                {rootData?.cartSuggestions && (
                    <Suspense fallback={<CartSuggestionsSkeleton />}>
                        <Await resolve={rootData.cartSuggestions}>
                            {products => <CartSuggestions products={products} layout={layout} />}
                        </Await>
                    </Suspense>
                )}
            </div>

            {/* Fixed summary at bottom (outside scroll area) */}
            {cartHasItems && (
                <CartSummary
                    cart={cart}
                    layout={layout}
                    isLoggedIn={isLoggedIn}
                    hasStoreCredit={hasStoreCredit}
                    shippingConfig={shippingConfig}
                />
            )}
        </div>
    );
}

/**
 * Header for the cart aside with title, item count, and close button
 *
 * Displayed in both empty cart and filled cart states for consistent UX.
 *
 * @param itemCount - Total number of items in cart (0 for empty cart)
 *
 * Mobile behavior:
 * - Shows "CLOSE" button (uppercase) for explicit close action
 * - Touch-friendly minimum touch target (44px via min-h-11)
 *
 * Desktop behavior:
 * - Close button is hidden (sm:hidden)
 * - Users can click backdrop or press ESC to close (handled by Sheet component)
 *
 * @accessibility
 * - Proper heading hierarchy with h2
 * - aria-label on close button for screen readers
 * - Semantic header element
 */
function CartAsideHeader({itemCount}: {itemCount: number}) {
    const {close} = useAside();

    return (
        <header className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-primary-foreground/10">
            <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg mb-0 text-primary-foreground">Your Bag</h2>
                {itemCount > 0 && (
                    <span className="text-sm text-primary-foreground/70">
                        ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </span>
                )}
            </div>
            {/* Close button - mobile only
                Desktop users can click backdrop or press ESC to close */}
            <Button
                variant="ghost"
                size="sm"
                onClick={close}
                className="sm:hidden min-h-11 px-2 text-sm font-semibold tracking-widest text-primary-foreground/70 hover:text-primary-foreground hover:bg-transparent"
                aria-label="Close cart"
            >
                CLOSE
            </Button>
        </header>
    );
}

function CartEmpty({hidden = false, layout}: {hidden: boolean; layout: CartLayout}) {
    const {close} = useAside();
    const isPage = layout === "page";

    if (hidden) return null;

    return (
        <div className="flex w-full flex-col">
            <Empty className="border-0 py-8 sm:py-12 md:py-16 flex-none">
                <EmptyHeader className="gap-3 sm:gap-4">
                    <EmptyMedia>
                        <ShoppingCart
                            className={cn(
                                "size-10 sm:size-12 md:size-16",
                                isPage ? "text-primary/60" : "text-primary-foreground/60"
                            )}
                        />
                    </EmptyMedia>
                    <EmptyTitle
                        className={cn(
                            "font-serif text-xl sm:text-2xl md:text-3xl",
                            isPage ? "text-primary" : "text-primary-foreground"
                        )}
                    >
                        Your cart is empty
                    </EmptyTitle>
                </EmptyHeader>
                <Link
                    to="/collections/all-products"
                    onClick={layout === "aside" ? close : undefined}
                    prefetch="viewport"
                    className={cn(
                        "rounded-full border-2 px-3 sm:px-4 py-2.5 sm:py-2 font-sans text-base sm:text-lg font-medium motion-interactive min-h-11 inline-flex items-center justify-center cursor-pointer",
                        isPage
                            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-light bg-light text-primary hover:bg-light/90"
                    )}
                >
                    Continue shopping
                </Link>
            </Empty>

        </div>
    );
}

/**
 * Deterministically shuffles an array based on product IDs
 * Uses ID-based hashing for consistent pseudo-random ordering across renders
 * This ensures products appear in the same order without re-shuffling on re-renders
 */
function shuffleArray<T extends {id: string}>(array: T[]): T[] {
    return [...array].sort((a, b) => {
        // Hash product IDs for consistent pseudo-random ordering
        const hashA = a.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const hashB = b.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return hashA - hashB;
    });
}

interface CartSuggestionsProps {
    products: CartSuggestionProductFragment[] | null;
    layout: CartLayout;
}

/**
 * CartSuggestions - Product recommendations carousel for empty cart state
 *
 * Carousel configuration optimized for cart aside drawer context:
 * - **Responsive Breakpoints**: Optimized for aside width (narrower than full-page)
 *   - Mobile (< 640px): basis-[85%] - Shows 1 full item + peek of next (~1.2 items visible)
 *   - Tablet (640px+): basis-[48%] - Shows 2 full items + peek (~2.1 items visible)
 *   - Desktop (1024px+): basis-1/2 - Shows exactly 2 items in aside width
 *   - Large (1280px+): basis-1/2 - Maintains 2 items (aside width doesn't grow)
 *
 * Note: Unlike full-page carousels that use basis-[80%] → [45%] → [32%] → [27%] → [22%],
 * this carousel is constrained by the fixed aside width (~400-450px), so breakpoints
 * are adjusted to show appropriate item counts within that narrower container.
 *
 * Features:
 * - Drag-free scrolling with momentum (dragFree: true)
 * - Infinite loop for continuous browsing
 * - Wheel gesture support for trackpad/mouse scrolling
 * - Desktop navigation arrows (hidden on mobile, touch/swipe preferred)
 * - Auto-close aside when product is clicked
 * - Randomized product order (shuffled, limited to 8 items)
 *
 * Accessibility:
 * - role="region" with aria-roledescription="carousel" (from Carousel component)
 * - Keyboard navigation via arrow keys (from Carousel component)
 * - Screen reader labels on navigation buttons
 * - Touch targets meet 44px minimum (WCAG 2.5.5)
 */
function CartSuggestions({products, layout}: CartSuggestionsProps) {
    const {close} = useAside();

    // Close the aside when any product link is clicked — stable so onClickCapture doesn't recreate.
    // Declared before any conditional return to satisfy Rules of Hooks.
    const handleProductClick = useCallback(() => {
        close();
    }, [close]);

    // Shuffle products deterministically (consistent ordering across renders)
    const shuffledProducts = !products || products.length === 0 ? [] : shuffleArray(products).slice(0, 8);

    if (shuffledProducts.length === 0) return null;

    return (
        <section
            className={cn("pt-2 pb-2 sm:pb-4", layout === "aside" ? "px-3 sm:px-4" : "px-0")}
            onClickCapture={e => {
                // Close aside when clicking any link within the carousel
                // But NOT when clicking buttons (like Quick Add) inside the link
                const target = e.target as HTMLElement;
                if (target.closest("a") && !target.closest("button") && !target.closest("form")) {
                    handleProductClick();
                }
            }}
            aria-label="Product suggestions"
        >
            <p className="py-3 text-sm font-medium tracking-wide text-primary-foreground/80 px-0">
                You might also like
            </p>
            {/* Carousel with navigation controls for desktop users */}
            <div className="relative">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                        dragFree: false,
                        skipSnaps: false
                    }}
                    plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2 md:-ml-3">
                        {shuffledProducts.map(product => (
                            <CarouselItem
                                key={product.id}
                                className="pl-2 md:pl-3 basis-[56%] sm:basis-[44%] lg:basis-[38%] xl:basis-[35%]"
                            >
                                <ProductItem
                                    product={product}
                                    loading="lazy"
                                    variant="card"
                                    compactMode={true}
                                    showBadges={false}
                                    showQuickAdd={true}
                                    showWishlist={true}
                                    darkContext={true}
                                    skipCartOpen={true}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {/* Navigation arrows - hidden on mobile, shown on tablet+ */}
                    {/* Custom styling to fit within aside drawer constraints
                         WCAG Compliance:
                         - Size: 40px (size-10) → 44px (md:size-11) meets minimum touch target (WCAG 2.5.5)
                         - Contrast: primary-foreground (#fff) on primary/90 = ~13:1 (WCAG AAA) ✓
                         - Icons: 3:1 minimum for UI components (WCAG 1.4.11) - actual: ~13:1 ✓
                         - Focus ring: Inherits from carousel component (14.68:1 contrast) ✓
                    */}
                    <CarouselPrevious
                        className="left-0 sm:left-1 bg-primary/90 hover:bg-primary text-primary-foreground border-0 size-10 md:size-11"
                        aria-label="Previous products"
                    />
                    <CarouselNext
                        className="right-0 sm:right-1 bg-primary/90 hover:bg-primary text-primary-foreground border-0 size-10 md:size-11"
                        aria-label="Next products"
                    />
                </Carousel>
            </div>
        </section>
    );
}

const SKELETON_IDS = ["skeleton-1", "skeleton-2", "skeleton-3"] as const;

/**
 * Loading skeleton for CartSuggestions carousel
 * Matches the actual carousel layout with responsive breakpoints
 */
function CartSuggestionsSkeleton() {
    return (
        <section className="pt-4 pb-6 sm:pb-8 px-3 sm:px-4">
            {/* Section title skeleton */}
            <Skeleton className="h-4 sm:h-5 w-28 sm:w-32 mb-3 sm:mb-4 bg-overlay-light-hover" />

            {/* Product cards skeleton - matches carousel breakpoints */}
            <div className="flex gap-2 md:gap-3 overflow-hidden">
                {SKELETON_IDS.map(id => (
                    <div key={id} className="shrink-0 basis-[85%] sm:basis-[48%] lg:basis-1/2 space-y-1.5 sm:space-y-2">
                        <Skeleton className="aspect-4/5 w-full rounded-sm bg-overlay-light-hover" />
                        <Skeleton className="h-2.5 sm:h-3 w-3/4 bg-overlay-light-hover" />
                        <Skeleton className="h-2.5 sm:h-3 w-1/2 bg-overlay-light-hover" />
                    </div>
                ))}
            </div>
        </section>
    );
}
